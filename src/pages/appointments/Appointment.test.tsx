import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Menu } from "../../components/layout/menu";
import * as artistApi from "../../services/artistServices";
import Appointment from "./Appointment";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof artistApi>()),
  getArtistAppointmentsPaginated: vi.fn(),
  getCustomerById: vi.fn(),
  DeleteAppointment: vi.fn(),
}));
vi.mock("../../services/paymentServices", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/paymentServices")>()),
  getSquarePaymentStatus: vi.fn(() => Promise.reject(new Error("no Square"))),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../../context/useAuth", () => ({
  default: () => ({
    user: {
      userId: "artist-1",
      services: [
        { _id: "a", id: 1, service: "Microblading" },
        { _id: "b", id: 100001, service: "Freckles", custom: true },
      ],
    },
  }),
}));

const mocked = vi.mocked(artistApi);

const appointment = (over: Record<string, unknown>) => ({
  _id: "x",
  id: "x",
  customerId: "c1",
  artistId: "artist-1",
  date: "2026-12-01T10:00:00.000Z",
  services: [1],
  signed: false,
  allFormsCompleted: false,
  deleted: false,
  createdAt: "",
  updatedAt: "",
  formsToFillCount: 1,
  filledForms: [],
  serviceDetails: [{ _id: "s", id: 1, service: "Microblading" }],
  customer: { id: "c1", info: { client_name: "Ada Obi" } },
  ...over,
});

const reply = (appointments: unknown[], total = appointments.length, lastPage = 1) =>
  ({ data: { appointments, metadata: { total, lastPage } } }) as never;

const Where = () => {
  const location = useLocation();
  return <p data-testid="where">{location.search}</p>;
};

const renderPage = (url = "/appointments") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/appointments"
          element={
            <>
              <Appointment />
              <Where />
            </>
          }
        />
        <Route
          path="/clients/:id/appointments/:appointmentId/forms"
          element={<FormsPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

const FormsPage = () => {
  const location = useLocation();
  return (
    <p data-testid="forms-page">
      {location.pathname} for {location.state?.clientName}
    </p>
  );
};

/** the filters the page asked the API for last */
const lastFilters = () => {
  const calls = mocked.getArtistAppointmentsPaginated.mock.calls;
  return calls[calls.length - 1];
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getArtistAppointmentsPaginated.mockResolvedValue(
    reply([
      appointment({ id: "a1" }),
      appointment({
        id: "a2",
        customerId: "c2",
        customer: { id: "c2", info: { client_name: "Bea Lee" } },
        signed: true,
        serviceDetails: [
          { _id: "s", id: 1, service: "Microblading" },
          { _id: "t", id: 100001, service: "Freckles" },
        ],
      }),
    ]),
  );
});

describe("Appointments page", () => {
  it("is in the sidebar menu", () => {
    expect(Menu.map((item) => item.basePath)).toContain("/appointments");
  });

  it("shows names from the list without looking each client up", async () => {
    renderPage();
    expect(await screen.findByText("Ada Obi")).toBeInTheDocument();
    expect(screen.getByText("Bea Lee")).toBeInTheDocument();
    // every service on the appointment, not just the first
    const lists = screen.getAllByRole("list", { name: "Services" });
    expect(within(lists[1]).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Microblading",
      "Freckles",
    ]);
    expect(screen.getByText("Forms pending", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Forms signed", { selector: "span" })).toBeInTheDocument();
    expect(mocked.getCustomerById).not.toHaveBeenCalled();
    expect(lastFilters()).toEqual([1, 12, {}]);
  });

  it("searches by client or service on the server, keeping the box focused", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Ada Obi");

    const box = screen.getByRole("searchbox", { name: "Search by client or service" });
    await user.type(box, "freck");
    await waitFor(() =>
      expect(lastFilters()).toEqual([1, 12, { search: "freck" }]),
    );
    expect(box).toHaveFocus();
    expect(screen.getByTestId("where")).toHaveTextContent("q=freck");
  });

  it("filters by when, status and service, starting again from page 1", async () => {
    const user = userEvent.setup();
    renderPage("/appointments?page=3");
    await screen.findByText("Ada Obi");
    expect(lastFilters()[0]).toBe(3);

    await user.click(screen.getByRole("radio", { name: "Upcoming" }));
    await waitFor(() => expect(lastFilters()[0]).toBe(1));
    const upcoming = lastFilters()[2] as artistApi.AppointmentFilters;
    expect(upcoming.sort).toBe("asc");
    expect(new Date(upcoming.from!).getHours()).toBe(0);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "signed");
    await user.selectOptions(screen.getByRole("combobox", { name: "Service" }), "100001");
    await waitFor(() =>
      expect(lastFilters()[2]).toMatchObject({ status: "signed", service: 100001 }),
    );

    await user.click(screen.getByRole("radio", { name: "Past" }));
    await waitFor(() => expect(lastFilters()[2]).toHaveProperty("to"));
    expect(lastFilters()[2]).not.toHaveProperty("from");
  });

  it("says when nothing matches and clears the filters", async () => {
    const user = userEvent.setup();
    mocked.getArtistAppointmentsPaginated.mockResolvedValue(reply([]));
    renderPage("/appointments?q=zzz&status=completed");
    expect(await screen.findByText("No appointments match")).toBeInTheDocument();
    expect(screen.getByText("0 matching appointments")).toBeInTheDocument();
    expect(lastFilters()[2]).toEqual({ search: "zzz", status: "completed" });

    await user.click(screen.getByRole("button", { name: /Clear filters/ }));
    await waitFor(() => expect(lastFilters()[2]).toEqual({}));
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("pages through results", async () => {
    const user = userEvent.setup();
    mocked.getArtistAppointmentsPaginated.mockResolvedValue(
      reply([appointment({ id: "a1" })], 30, 3),
    );
    renderPage();
    await screen.findByText("Page 1 of 3");
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(lastFilters()[0]).toBe(2));
  });

  it("ignores a slow earlier reply", async () => {
    let finishFirst!: (value: unknown) => void;
    mocked.getArtistAppointmentsPaginated
      .mockImplementationOnce(
        () => new Promise((resolve) => (finishFirst = resolve)) as never,
      )
      .mockResolvedValue(reply([appointment({ id: "b1", customer: { id: "c9", info: { client_name: "New Result" } } })]));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("radio", { name: "Past" }));
    expect(await screen.findByText("New Result")).toBeInTheDocument();

    finishFirst(reply([appointment({ id: "old", customer: { id: "c8", info: { client_name: "Old Result" } } })]));
    await new Promise((r) => setTimeout(r, 20));
    const grid = document.querySelector(".appointments__grid") as HTMLElement;
    expect(within(grid).queryByText("Old Result")).toBeNull();
  });

  it("opens the forms for the appointment that was picked", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Bea Lee");
    expect(screen.queryByText(/View Full Schedule/i)).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "View appointment forms for Bea Lee" }),
    );
    expect(screen.getByTestId("forms-page")).toHaveTextContent(
      "/clients/c2/appointments/a2/forms for Bea Lee",
    );
  });

  it("has the same ⋯ actions as the client's appointments", async () => {
    mocked.getArtistAppointmentsPaginated.mockResolvedValue(
      reply([appointment({ id: "a1" }), appointment({ id: "a2", signed: true })], 2),
    );
    mocked.DeleteAppointment.mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderPage();

    const menus = await screen.findAllByRole("button", {
      name: "Actions for Ada Obi's appointment",
    });
    expect(menus).toHaveLength(2);
    const first = menus[0].parentElement as HTMLElement;
    for (const action of [
      "View Forms",
      "Share consent form link",
      "Send pre-care instructions",
      "Send aftercare instructions",
      "Send healing check-in",
      "Add products used",
      "Mark as complete",
      "Delete",
    ]) {
      expect(within(first).getByRole("button", { name: action })).toBeInTheDocument();
    }
    // a signed appointment can't be sent the forms again
    const second = menus[1].parentElement as HTMLElement;
    expect(within(second).queryByRole("button", { name: "Share consent form link" })).toBeNull();

    await user.click(within(first).getByRole("button", { name: "Delete" }));
    await user.click(
      within(
        document.querySelector(".delete-client-confirm-modal") as HTMLElement,
      ).getByRole("button", { name: "Delete" }),
    );
    await waitFor(() => expect(screen.getAllByRole("button", {
      name: "Actions for Ada Obi's appointment",
    })).toHaveLength(1));
    expect(mocked.DeleteAppointment).toHaveBeenCalledWith("a1");
    expect(screen.getByText("Total: 1 appointment")).toBeInTheDocument();
  });
});
