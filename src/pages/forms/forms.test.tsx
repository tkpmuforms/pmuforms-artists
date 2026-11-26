import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as artistApi from "../../services/artistServices";
import FormsPage from "./forms";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof artistApi>()),
  getArtistForms: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
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
vi.mock("../../components/profile/UpdateServicesModal", () => ({
  default: () => null,
}));

const mocked = vi.mocked(artistApi);
// jsdom has no scrolling
window.scrollTo = vi.fn() as never;

const apiForm = (over: Record<string, unknown>) => ({
  id: "f",
  title: "Form",
  type: "consent",
  services: [],
  versionNumber: 0,
  rootFormTemplateId: null,
  updatedAt: "2026-11-01T10:00:00.000Z",
  createdAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

const Where = () => <p data-testid="where">{useLocation().search}</p>;

const renderPage = (url = "/forms") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/forms"
          element={
            <>
              <FormsPage />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const titles = () =>
  screen
    .queryAllByRole("heading", { level: 3 })
    .map((h) => h.textContent);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getArtistForms.mockResolvedValue({
    data: {
      forms: [
        // a library form, unchanged; it also lists a service the artist doesn't offer
        apiForm({ id: "lib", title: "Brow Consent", services: [1, 2] }),
        // a library form the artist edited
        apiForm({
          id: "lib-v2",
          title: "Allergy Consent",
          services: [1, 100001],
          versionNumber: 2,
          rootFormTemplateId: "allergy",
          updatedAt: "2026-11-20T10:00:00.000Z",
        }),
        // one the artist made, not on a service yet
        apiForm({
          id: "custom-123",
          title: "Photo Release",
          services: [],
          updatedAt: "2026-11-10T10:00:00.000Z",
        }),
        apiForm({ id: "care", title: "Aftercare Guide", type: "care", services: [100001] }),
      ],
    },
  } as never);
});

describe("Forms page", () => {
  it("shows the artist's services on each card, and where the form came from", async () => {
    renderPage();
    await screen.findByText("Brow Consent");

    const brow = screen.getByRole("list", { name: "Brow Consent services" });
    // only services the artist offers
    expect(within(brow).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Microblading",
    ]);
    const allergy = screen.getByRole("list", { name: "Allergy Consent services" });
    expect(within(allergy).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Microblading",
      "Freckles",
    ]);
    expect(screen.getByText("Not on any of your services")).toBeInTheDocument();
    const badges = [...document.querySelectorAll(".form-card__source")].map(
      (b) => b.textContent,
    );
    expect(badges.sort()).toEqual(["Edited", "Made by you"]);
    // newest first
    expect(titles()).toEqual(["Allergy Consent", "Photo Release", "Brow Consent"]);
  });

  it("filters by service, with counts on the chips", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Brow Consent");

    const chips = screen.getByRole("group", { name: "Filter by service" });
    await user.click(within(chips).getByRole("button", { name: /Freckles/ }));
    expect(titles()).toEqual(["Allergy Consent"]);
    expect(screen.getByText("1 of 3 consent forms")).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("service=100001");

    await user.click(within(chips).getByRole("button", { name: /Not on a service/ }));
    expect(titles()).toEqual(["Photo Release"]);
    expect(within(chips).getByRole("button", { name: /Microblading/ })).toHaveTextContent("2");
  });

  it("searches by service name too, and updates the tab counts", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Brow Consent");

    await user.type(
      screen.getByRole("searchbox", { name: "Search forms by title or service" }),
      "freck",
    );
    expect(titles()).toEqual(["Allergy Consent"]);
    expect(screen.getByRole("tab", { name: "Consent (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Aftercare (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pre-care (0)" })).toBeInTheDocument();
  });

  it("filters by where the form came from and sorts A–Z", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Brow Consent");

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort forms" }), "az");
    expect(titles()).toEqual(["Allergy Consent", "Brow Consent", "Photo Release"]);

    const source = screen.getByRole("combobox", { name: "Where the form came from" });
    await user.selectOptions(source, "mine");
    expect(titles()).toEqual(["Photo Release"]);
    await user.selectOptions(source, "library");
    expect(titles()).toEqual(["Brow Consent"]);

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(titles()).toHaveLength(3);
    expect(screen.getByTestId("where")).toHaveTextContent(/^$/);
  });

  it("keeps filters from the address and says when nothing matches", async () => {
    const user = userEvent.setup();
    renderPage("/forms?type=care&q=zzz");
    await screen.findByRole("tab", { name: "Aftercare (0)", selected: true });
    expect(screen.getByText("No aftercare forms match these filters.")).toBeInTheDocument();

    const clear = screen.getAllByRole("button", { name: /Clear filters/ });
    await user.click(clear[clear.length - 1]);
    expect(titles()).toEqual(["Aftercare Guide"]);
    expect(screen.getByTestId("where")).toHaveTextContent("type=care");
  });

  it("shows 12 forms a page and starts again from the first page on a new filter", async () => {
    mocked.getArtistForms.mockResolvedValue({
      data: {
        forms: Array.from({ length: 30 }, (_, i) =>
          apiForm({
            id: `f${i}`,
            title: `Consent ${String(i + 1).padStart(2, "0")}`,
          }),
        ),
      },
    } as never);
    const user = userEvent.setup();
    renderPage("/forms?sort=az");

    await screen.findByText("Page 1 of 3");
    expect(titles()).toHaveLength(12);
    expect(titles()[0]).toBe("Consent 01");
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(titles()).toHaveLength(6);
    expect(titles()[0]).toBe("Consent 25");
    expect(screen.getByTestId("where")).toHaveTextContent("page=3");

    await user.type(screen.getByPlaceholderText(/Search/), "Consent 1");
    expect(screen.getByTestId("where")).not.toHaveTextContent("page=");
    expect(titles()).toHaveLength(10);
    expect(screen.queryByText(/Page \d of/)).toBeNull();
  });
});
