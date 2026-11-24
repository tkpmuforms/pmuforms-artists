import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as artistApi from "../../services/artistServices";
import ClientsPage from "./Client";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof artistApi>()),
  searchCustomers: vi.fn(),
}));
vi.mock("../../context/useAuth", () => ({
  default: () => ({
    user: {
      services: [
        { _id: "a", id: 1, service: "Microblading" },
        { _id: "b", id: 100001, service: "Freckles", custom: true },
      ],
    },
  }),
}));
vi.mock("../../components/clientsComp/ClientSearchModal", () => ({
  default: () => null,
}));
vi.mock("../../components/clientsComp/AddClientModal", () => ({
  default: () => null,
}));

const mocked = vi.mocked(artistApi);
const nextYear = new Date().getFullYear() + 1;

const customer = (id: string, name: string, summary: object) => ({
  id,
  name,
  email: `${id}@example.com`,
  info: { client_name: name },
  summary,
});

const Where = () => <p data-testid="where">{useLocation().search}</p>;

const renderPage = (url = "/clients") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/clients"
          element={
            <>
              <ClientsPage />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const lastCall = () => {
  const calls = mocked.searchCustomers.mock.calls;
  return calls[calls.length - 1];
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.searchCustomers.mockResolvedValue({
    data: {
      metadata: { total: 3 },
      customers: [
        customer("c1", "Ada Obi", {
          appointmentCount: 2,
          lastVisit: "2026-11-01T10:00:00.000Z",
          nextAppointment: `${nextYear}-01-05T15:00:00.000Z`,
          formsPending: true,
          services: [1],
        }),
        customer("c2", "Bea Lee", {
          appointmentCount: 1,
          lastVisit: "2025-03-02T10:00:00.000Z",
          nextAppointment: null,
          formsPending: false,
          services: [100001],
        }),
        customer("c3", "Cy Ray", {
          appointmentCount: 0,
          lastVisit: null,
          nextAppointment: null,
          formsPending: false,
          services: [],
        }),
      ],
    },
  } as never);
});

describe("Clients page", () => {
  it("shows each client's next or last visit, and pending forms", async () => {
    renderPage();
    const ada = (await screen.findByText("Ada Obi")).closest("button")!;
    expect(ada).toHaveTextContent(`Next: Jan 5, ${nextYear}`);
    expect(within(ada).getByText("Forms pending")).toBeInTheDocument();
    const bea = screen.getByText("Bea Lee").closest("button")!;
    expect(bea).toHaveTextContent("Last visit: Mar 2, 2025");
    expect(within(bea).queryByText("Forms pending")).toBeNull();
    expect(screen.getByText("Cy Ray").closest("button")).toHaveTextContent(
      "No appointments yet",
    );
    expect(lastCall()).toEqual([undefined, 1, 20, { sort: "name", formsPending: false }]);
  });

  it("asks the server for clients matching the filters", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Ada Obi");
    const filters = screen.getByRole("group", { name: "Filter clients" });

    await user.click(within(filters).getByRole("button", { name: "Not back in 6+ months" }));
    await waitFor(() => expect(lastCall()[3]).toMatchObject({ activity: "lapsed" }));

    await user.click(within(filters).getByRole("button", { name: "Forms pending" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Service booked" }), "100001");
    await user.selectOptions(screen.getByRole("combobox", { name: "Sort clients" }), "last-visit");
    await waitFor(() =>
      expect(lastCall()[3]).toEqual({
        activity: "lapsed",
        formsPending: true,
        service: 100001,
        sort: "last-visit",
      }),
    );
    expect(lastCall()[1]).toBe(1);
    expect(screen.getByText(/Matching clients/)).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent(
      "activity=lapsed&forms=pending&service=100001&sort=last-visit",
    );

    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    await waitFor(() =>
      expect(lastCall()[3]).toEqual({ formsPending: false, sort: "last-visit" }),
    );
  });

  it("keeps filters from the address and says when nothing matches", async () => {
    mocked.searchCustomers.mockResolvedValue({
      data: { metadata: { total: 0 }, customers: [] },
    } as never);
    renderPage("/clients?activity=never&service=1");
    expect(await screen.findByText("No clients match these filters.")).toBeInTheDocument();
    expect(lastCall()[3]).toMatchObject({ activity: "never", service: 1 });
    expect(
      screen.getByRole("button", { name: "Never booked", pressed: true }),
    ).toBeInTheDocument();
  });
});
