import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../services/artistServices";
import EditForms from "./EditForms";

vi.mock("../../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  getFormById: vi.fn(),
  getServices: vi.fn(),
  addFormSectionData: vi.fn(),
  updateFormSectionData: vi.fn(),
  deleteFormSectionData: vi.fn(),
  updateFormServices: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../../../context/useAuth", () => ({
  default: () => ({ user: { userId: "artist-1", businessName: "Glow Studio" } }),
}));

const mocked = vi.mocked(api);

type Field = { id: string; title: string; line: string; type?: string; required?: boolean };
const version = (id: string, fields: Field[]) => ({
  data: {
    form: {
      id,
      title: "Brow Consent",
      type: "consent",
      services: [0],
      sections: [{ id: "s1", title: "Consent", data: fields }],
    },
  },
});

const original: Field[] = [
  { id: "intro", title: "Welcome to {{user.businessName}}", line: "full" },
  { id: "agree", title: "I agree", line: "full", type: "checkbox", required: true },
];

const Where = () => <p data-testid="where">{useLocation().pathname}</p>;

const renderEditor = (id = "brow-consent") =>
  render(
    <MemoryRouter initialEntries={[`/forms/edit/${id}`]}>
      <Routes>
        <Route
          path="/forms/edit/:formId"
          element={
            <>
              <EditForms />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

/** taps "+ Tap to add…" under a field and fills in the dialog */
const addField = async (
  user: ReturnType<typeof userEvent.setup>,
  afterIndex: number,
  kind: string,
  text: string,
) => {
  await user.click(
    screen.getAllByRole("button", { name: "+ Tap to add question or Paragraph" })[afterIndex],
  );
  await user.click(screen.getByRole("button", { name: new RegExp(kind) }));
  await user.type(screen.getByLabelText(/Field Title|Paragraph text/), text);
  await user.click(screen.getByRole("button", { name: "Add Field" }));
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getServices.mockResolvedValue({ data: { services: [] } } as never);
  mocked.getFormById.mockResolvedValue(version("brow-consent", original) as never);
});

describe("adding to a form", () => {
  it("shows the new question as soon as it's saved, without reloading the page", async () => {
    const user = userEvent.setup();
    renderEditor();
    expect(await screen.findByText("Welcome to Glow Studio")).toBeInTheDocument();

    mocked.addFormSectionData.mockResolvedValue(
      version("brow-consent-artist-1-1", [
        original[0],
        { id: "new-q", title: "Any allergies?", line: "full", type: "text", required: true },
        original[1],
      ]) as never,
    );
    await addField(user, 0, "Text Field", "Any allergies?");

    expect(await screen.findByText("Any allergies?")).toBeInTheDocument();
    expect(mocked.addFormSectionData).toHaveBeenCalledWith("brow-consent", "s1", {
      line: "full",
      title: "Any allergies?",
      type: "text",
      required: false,
      after: "intro",
    });
    // the dialog closed, the page didn't reload, and it now edits the new version
    expect(screen.queryByLabelText("Field Title")).toBeNull();
    expect(screen.getByTestId("where")).toHaveTextContent("/forms/edit/brow-consent-artist-1-1");
    expect(mocked.getFormById).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("All changes saved");
    expect(document.querySelector('[data-field-id="new-q"]')).toHaveClass(
      "field-container--new",
    );
    // in order, right after the field it was added under
    const labels = screen
      .getAllByText(/Welcome to Glow Studio|Any allergies\?|I agree/)
      // required ones carry a *
      .map((el) => el.textContent?.replace("*", "").trim());
    expect(labels).toEqual(["Welcome to Glow Studio", "Any allergies?", "I agree"]);
  });

  it("builds each addition on the last one, so nothing added earlier is lost", async () => {
    const user = userEvent.setup();
    renderEditor();
    await screen.findByText("I agree");

    const first = [
      ...original,
      { id: "q2", title: "First added", line: "full", type: "text" },
    ];
    mocked.addFormSectionData.mockResolvedValueOnce(
      version("brow-consent-artist-1-1", first) as never,
    );
    await addField(user, 1, "Text Field", "First added");
    await screen.findByText("First added");

    mocked.addFormSectionData.mockResolvedValueOnce(
      version("brow-consent-artist-1-2", [
        ...first,
        { id: "q3", title: "Second added", line: "full", type: "date" },
      ]) as never,
    );
    await addField(user, 2, "Date", "Second added");

    expect(await screen.findByText("Second added")).toBeInTheDocument();
    expect(screen.getByText("First added")).toBeInTheDocument();
    expect(mocked.addFormSectionData).toHaveBeenLastCalledWith(
      "brow-consent-artist-1-1",
      "s1",
      expect.objectContaining({ title: "Second added", after: "q2" }),
    );
    expect(screen.getByTestId("where")).toHaveTextContent("/forms/edit/brow-consent-artist-1-2");
  });

  it("adds a paragraph as text to read, with no answer to require", async () => {
    const user = userEvent.setup();
    renderEditor();
    await screen.findByText("I agree");
    mocked.addFormSectionData.mockResolvedValue(
      version("brow-consent-artist-1-1", [
        ...original,
        { id: "p1", title: "Please arrive 10 minutes early.", line: "full" },
      ]) as never,
    );

    await user.click(
      screen.getAllByRole("button", { name: "+ Tap to add question or Paragraph" })[1],
    );
    await user.click(screen.getByRole("button", { name: /Paragraph Only/ }));
    expect(screen.queryByRole("checkbox", { name: /Required field/ })).toBeNull();
    const text = screen.getByLabelText("Paragraph text");
    expect(text.tagName).toBe("TEXTAREA");
    await user.type(text, "Please arrive 10 minutes early.");
    await user.click(screen.getByRole("button", { name: "Add Field" }));

    expect(await screen.findByText("Please arrive 10 minutes early.")).toBeInTheDocument();
    expect(mocked.addFormSectionData).toHaveBeenCalledWith("brow-consent", "s1", {
      line: "full",
      title: "Please arrive 10 minutes early.",
      after: "agree",
    });
  });

  it("shows it's working while saving and can't be sent twice", async () => {
    let finish: (value: unknown) => void = () => undefined;
    mocked.addFormSectionData.mockReturnValue(
      new Promise((resolve) => (finish = resolve)) as never,
    );
    const user = userEvent.setup();
    renderEditor();
    await screen.findByText("I agree");

    await addField(user, 0, "Text Field", "Phone");
    const adding = screen.getByRole("button", { name: "Adding…" });
    expect(adding).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Saving…");
    await user.click(adding);
    expect(mocked.addFormSectionData).toHaveBeenCalledTimes(1);

    await act(async () =>
      finish(
        version("brow-consent-artist-1-1", [
          ...original,
          { id: "q9", title: "Phone", line: "full", type: "text" },
        ]),
      ),
    );
    expect(await screen.findByText("Phone")).toBeInTheDocument();
  });

  it("keeps what was typed when saving fails", async () => {
    mocked.addFormSectionData.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderEditor();
    await screen.findByText("I agree");

    await addField(user, 0, "Text Field", "Phone");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Last change didn't save"),
    );
    expect(screen.getByLabelText("Field Title")).toHaveValue("Phone");
    expect(screen.getByRole("button", { name: "Add Field" })).toBeEnabled();
    expect(screen.getByTestId("where")).toHaveTextContent("/forms/edit/brow-consent");
  });
});

describe("saving", () => {
  it("reloads the latest version from the server and shows it", async () => {
    const user = userEvent.setup();
    renderEditor();
    await screen.findByText("I agree");

    mocked.addFormSectionData.mockResolvedValue(
      version("brow-consent-artist-1-1", [
        ...original,
        { id: "q2", title: "Added", line: "full", type: "text" },
      ]) as never,
    );
    await addField(user, 1, "Text Field", "Added");
    await screen.findByText("Added");

    mocked.getFormById.mockResolvedValue(
      version("brow-consent-artist-1-1", [
        ...original,
        { id: "q2", title: "Added", line: "full", type: "text" },
      ]) as never,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mocked.getFormById).toHaveBeenLastCalledWith("brow-consent-artist-1-1"),
    );
    expect(await screen.findByText("Added")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("All changes saved");
  });

  it("shows edits and deletions from the version the server saved", async () => {
    const user = userEvent.setup();
    renderEditor();
    const agree = (await screen.findByText("I agree")).closest(".field-container")!;

    mocked.deleteFormSectionData.mockResolvedValue(
      version("brow-consent-artist-1-1", [original[0]]) as never,
    );
    const icons = agree.querySelectorAll(".field-action-icon");
    await user.click(icons[1] as Element);
    const dialog = document.querySelector(".delete-confirm-modal") ?? document.body;
    const buttons = within(dialog as HTMLElement).getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(screen.queryByText("I agree")).toBeNull());
    expect(screen.getByTestId("where")).toHaveTextContent("/forms/edit/brow-consent-artist-1-1");
    expect(mocked.getFormById).toHaveBeenCalledTimes(1);
  });
});
