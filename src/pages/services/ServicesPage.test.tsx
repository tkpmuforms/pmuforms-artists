import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as artistApi from "../../services/artistServices";
import * as api from "../../services/formBuilderServices";
import ServicesPage from "./ServicesPage";

vi.mock("../../services/formBuilderServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  createCustomService: vi.fn(),
  renameCustomService: vi.fn(),
  deleteCustomService: vi.fn(),
  getFormsForService: vi.fn(),
  getFormLibrary: vi.fn(),
  addServiceToForm: vi.fn(),
  removeServiceFromForm: vi.fn(),
}));
vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof artistApi>()),
  getAuthMe: vi.fn(),
  getArtistForms: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
const dispatch = vi.fn();
vi.mock("react-redux", () => ({ useDispatch: () => dispatch }));
let services = [
  { _id: "a", id: 0, service: "Microblading" },
  { _id: "b", id: 100000, service: "Brow Touch-Up" },
];
vi.mock("../../context/useAuth", () => ({
  default: () => ({ user: { userId: "artist-1", services } }),
}));

const mocked = vi.mocked(api);
const mockedArtist = vi.mocked(artistApi);

const form = (over: Partial<api.ApiForm>): api.ApiForm => ({
  id: "f",
  title: "Form",
  type: "consent",
  services: [0],
  ...over,
});

const Where = () => {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
};

const renderPage = (url = "/services") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/services" element={<ServicesPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  services = [
    { _id: "a", id: 0, service: "Microblading" },
    { _id: "b", id: 100000, service: "Brow Touch-Up" },
  ];
  mockedArtist.getAuthMe.mockResolvedValue({ data: { user: { userId: "artist-1" } } } as never);
  mocked.getFormsForService.mockResolvedValue({
    data: {
      forms: [
        form({ id: "a920ba0", title: "Brows Aftercare", type: "care" }),
        form({ id: "8ff13d0", title: "PMU Consent" }),
        form({
          id: "custom-studio-1",
          title: "Studio Intake",
          artistId: "artist-1",
        }),
      ],
    },
  } as never);
});

describe("ServicesPage", () => {
  it("lists services, marks the artist's own, and shows each one's forms", async () => {
    const user = userEvent.setup();
    renderPage();

    const list = screen.getByRole("list", { name: "Your services" });
    const own = within(list).getByRole("button", { name: /Brow Touch-Up/ });
    expect(own).toHaveTextContent("Yours");
    expect(within(list).getByRole("button", { name: /Microblading/ })).not.toHaveTextContent("Yours");

    await user.click(within(list).getByRole("button", { name: /Microblading/ }));
    const forms = await screen.findByRole("list", { name: "Forms for Microblading" });
    expect(mocked.getFormsForService).toHaveBeenCalledWith(0);
    // consent first, then aftercare
    expect(within(forms).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringContaining("PMU Consent"),
      expect.stringContaining("Studio Intake"),
      expect.stringContaining("Brows Aftercare"),
    ]);
    expect(within(forms).getAllByRole("listitem")[1]).toHaveTextContent("Yours");
    expect(within(forms).getAllByRole("link", { name: "Edit" })[0]).toHaveAttribute(
      "href",
      "/forms/edit/8ff13d0",
    );
    // shared services can't be renamed
    expect(screen.queryByRole("button", { name: /Rename/ })).toBeNull();
  });

  it("removes a form from a service after asking", async () => {
    mocked.removeServiceFromForm.mockResolvedValue({ data: { form: form({}) } } as never);
    const user = userEvent.setup();
    renderPage("/services?open=0");

    const forms = await screen.findByRole("list", { name: "Forms for Microblading" });
    await user.click(within(forms).getByRole("button", { name: "Remove PMU Consent" }));
    expect(forms).toHaveTextContent("Clients booking it won't get this form");
    await user.click(within(forms).getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(mocked.removeServiceFromForm).toHaveBeenCalledWith("8ff13d0", 0),
    );
    await waitFor(() => expect(mocked.getFormsForService).toHaveBeenCalledTimes(2));
  });

  it("creates a service of the artist's own and opens it", async () => {
    mocked.createCustomService.mockResolvedValue({
      data: { service: { id: 100001, service: "Freckles", custom: true }, services: [] },
    } as never);
    const user = userEvent.setup();
    const { rerender } = renderPage();

    await user.click(screen.getByRole("button", { name: /Create your own service/ }));
    await user.click(screen.getByRole("button", { name: "Add service" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Give the service a name.");

    await user.type(screen.getByLabelText("Service name"), "  Freckles ");
    await user.click(screen.getByRole("button", { name: "Add service" }));
    await waitFor(() => expect(mocked.createCustomService).toHaveBeenCalledWith("Freckles"));
    expect(dispatch).toHaveBeenCalled();

    // the refreshed user now offers it, and it's open for adding forms
    services = [...services, { _id: "c", id: 100001, service: "Freckles" }];
    rerender(
      <MemoryRouter initialEntries={["/services"]}>
        <Routes>
          <Route path="/services" element={<ServicesPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("list", { name: "Forms for Freckles" }),
    ).toBeInTheDocument();
    expect(mocked.getFormsForService).toHaveBeenCalledWith(100001);
  });

  it("explains a duplicate name", async () => {
    mocked.createCustomService.mockRejectedValue({
      response: { data: { message: '"Microblading" is already on the list.' } },
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /Create your own service/ }));
    await user.type(screen.getByLabelText("Service name"), "microblading");
    await user.click(screen.getByRole("button", { name: "Add service" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("already on the list");
  });

  it("renames and removes a custom service", async () => {
    mocked.renameCustomService.mockResolvedValue({ data: {} } as never);
    mocked.deleteCustomService.mockResolvedValue({ data: { services: [] } } as never);
    const user = userEvent.setup();
    renderPage("/services?open=100000");

    await user.click(await screen.findByRole("button", { name: /Rename/ }));
    const name = screen.getByLabelText("New name");
    await user.clear(name);
    await user.type(name, "Brow Refresh");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocked.renameCustomService).toHaveBeenCalledWith(100000, "Brow Refresh"),
    );

    await user.click(await screen.findByRole("button", { name: /Remove service/ }));
    expect(screen.getByText(/Past appointments keep it/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove service" }));
    await waitFor(() => expect(mocked.deleteCustomService).toHaveBeenCalledWith(100000));
  });

  describe("adding a form", () => {
    it("picks from the library and the artist's forms, skipping ones already on it", async () => {
      mockedArtist.getArtistForms.mockResolvedValue({
        data: {
          forms: [
            // the artist's edited copy of a library form
            form({
              id: "lip-consent-artist-1-1",
              rootFormTemplateId: "lip-consent",
              title: "Lip Consent",
              artistId: "artist-1",
            }),
            form({ id: "8ff13d0", title: "PMU Consent" }),
          ],
        },
      } as never);
      mocked.getFormLibrary.mockResolvedValue({
        data: {
          forms: [
            form({ id: "lip-consent", title: "Lip Consent" }),
            form({ id: "8ff13d0", title: "PMU Consent" }),
            form({ id: "tattoo-care", title: "Tattoo Aftercare", type: "care" }),
          ],
        },
      } as never);
      mocked.addServiceToForm.mockResolvedValue({ data: { form: form({}) } } as never);
      const user = userEvent.setup();
      renderPage("/services?open=0");

      await screen.findByRole("list", { name: "Forms for Microblading" });
      await user.click(screen.getByRole("button", { name: /Add a form/ }));
      const dialog = screen.getByRole("dialog", { name: "Add a form to Microblading" });
      await user.click(within(dialog).getByRole("button", { name: /Choose from our forms/ }));

      const choices = await within(dialog).findByRole("list", { name: "Forms you can add" });
      const rows = within(choices).getAllByRole("listitem");
      // PMU Consent is already on it; the artist's copy replaces the original
      expect(rows.map((r) => r.textContent)).toEqual([
        expect.stringContaining("Lip Consent"),
        expect.stringContaining("Tattoo Aftercare"),
      ]);
      expect(rows[0]).toHaveTextContent("Edited by you");

      await user.click(within(dialog).getByRole("button", { name: "Aftercare" }));
      expect(within(choices).getAllByRole("listitem")).toHaveLength(1);
      await user.click(within(dialog).getByRole("button", { name: "All" }));

      await user.click(within(choices).getByRole("button", { name: "Add Lip Consent" }));
      await waitFor(() =>
        expect(mocked.addServiceToForm).toHaveBeenCalledWith("lip-consent-artist-1-1", 0),
      );
      expect(
        await within(choices).findByRole("button", { name: "Lip Consent added" }),
      ).toBeDisabled();
    });

    it("sends scan and scratch to the new form page for this service", async () => {
      const user = userEvent.setup();
      renderPage("/services?open=100000");
      await user.click(await screen.findByRole("button", { name: /Add a form/ }));
      await user.click(screen.getByRole("button", { name: /Scan a paper form/ }));
      expect(screen.getByTestId("where")).toHaveTextContent(
        "/forms/new?mode=scan&service=100000",
      );
    });
  });
});
