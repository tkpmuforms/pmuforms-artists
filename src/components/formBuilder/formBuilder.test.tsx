import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewFormPage from "../../pages/forms/newForm/NewFormPage";
import * as api from "../../services/formBuilderServices";
import FormBuilder from "./FormBuilder";

vi.mock("../../services/formBuilderServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  createCustomForm: vi.fn(),
  getScanStatus: vi.fn(),
  scanPaperForm: vi.fn(),
}));
vi.mock("../../utils/compressImage", () => ({
  compressImage: vi.fn(async (file: Blob) => file),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../../context/useAuth", () => ({
  default: () => ({
    user: {
      userId: "artist-1",
      services: [
        { _id: "a", id: 0, service: "Microblading" },
        { _id: "b", id: 100000, service: "Brow Touch-Up" },
      ],
    },
  }),
}));

const mocked = vi.mocked(api);
const services = [
  { _id: "a", id: 0, service: "Microblading" },
  { _id: "b", id: 100000, service: "Brow Touch-Up" },
];

const Where = () => {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
};

const renderPage = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/forms/new" element={<NewFormPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocked.createCustomForm.mockResolvedValue({
    data: { form: { id: "custom-brow-1", title: "x", type: "consent", services: [] } },
  } as never);
  mocked.getScanStatus.mockResolvedValue({ data: { enabled: true, maxPages: 6 } } as never);
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("building a form from scratch", () => {
  it("saves the title, kind, services and every question", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(
      <FormBuilder
        draft={api.BLANK_DRAFT}
        services={services}
        initialServiceIds={[100000]}
        source="scratch"
        onSaved={onSaved}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Form title"), "Brow Consent");
    expect(screen.getByRole("button", { name: "Brow Touch-Up" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Microblading" }));

    const first = screen.getByRole("region", { name: "Section 1" });
    await user.type(within(first).getByLabelText("Section title"), "Your details");
    await user.click(within(first).getByRole("checkbox", { name: /client's details/ }));
    await user.type(within(first).getByLabelText("Question"), "Full name");
    await user.click(within(first).getByRole("checkbox", { name: "Required" }));

    await user.click(screen.getByRole("button", { name: /Add section/ }));
    const second = screen.getByRole("region", { name: "Section 2" });
    await user.click(within(second).getByRole("button", { name: /Text to read/ }));
    await user.type(within(second).getAllByLabelText("Question")[0], "Signature");
    await user.selectOptions(
      within(second).getAllByLabelText("Answer type")[0],
      "signature",
    );
    await user.type(
      within(second).getByLabelText("Text to read"),
      "I agree to the procedure.",
    );
    // the paragraph above the signature
    await user.click(within(second).getAllByRole("button", { name: "Move up" })[1]);

    await user.click(screen.getByRole("button", { name: "Create form" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocked.createCustomForm).toHaveBeenCalledWith({
      title: "Brow Consent",
      type: "consent",
      services: [100000, 0],
      source: "scratch",
      sections: [
        {
          title: "Your details",
          clientInformation: true,
          fields: [{ title: "Full name", kind: "text", required: true }],
        },
        {
          title: "",
          clientInformation: false,
          fields: [
            { title: "I agree to the procedure.", kind: "paragraph", required: false },
            { title: "Signature", kind: "signature", required: true },
          ],
        },
      ],
    });
  });

  it("asks for a title and a question before saving", async () => {
    const user = userEvent.setup();
    render(
      <FormBuilder
        draft={api.BLANK_DRAFT}
        services={services}
        source="scratch"
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Create form" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Give the form a title.");

    await user.type(screen.getByLabelText("Form title"), "Empty");
    await user.click(screen.getByRole("button", { name: "Create form" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Add at least one question");
    expect(screen.getByText(/Not on a service yet/)).toBeInTheDocument();
    expect(mocked.createCustomForm).not.toHaveBeenCalled();
  });

  it("shows what the API said when saving fails", async () => {
    mocked.createCustomForm.mockRejectedValue({
      response: { data: { message: "service with id 5 not found" } },
    });
    const user = userEvent.setup();
    render(
      <FormBuilder
        draft={{ title: "T", type: "care", sections: [{ title: "", fields: [{ title: "Q", kind: "text" }] }] }}
        services={services}
        source="scratch"
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    // client details only apply to forms clients fill in
    expect(screen.queryByRole("checkbox", { name: /client's details/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Create form" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("service with id 5 not found");
  });
});

describe("the new form page", () => {
  it("offers scanning or starting from scratch", async () => {
    const user = userEvent.setup();
    renderPage("/forms/new");
    await user.click(screen.getByRole("button", { name: /Start from scratch/ }));
    expect(screen.getByLabelText("Form title")).toBeInTheDocument();
  });

  it("scans photos into a draft, then saves it on the service it came from", async () => {
    mocked.scanPaperForm.mockResolvedValue({
      data: {
        draft: {
          title: "Studio Consent",
          type: "consent",
          sections: [
            {
              title: "Client",
              clientInformation: true,
              fields: [
                { title: "Name", kind: "text", required: true, autofill: "client-name" },
                { title: "I agree", kind: "checkbox", required: true },
              ],
            },
          ],
        },
        notes: ["The last line on page 2 was hard to read."],
      },
    } as never);
    const user = userEvent.setup();
    renderPage("/forms/new?mode=scan&service=100000");

    expect(screen.getByText("For Brow Touch-Up. Clients booking it will get this form.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read my form" })).toBeDisabled();

    const photo = new File(["x"], "page.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Choose photos"), [photo, photo]);
    expect(within(screen.getByRole("list", { name: "Pages" })).getAllByRole("listitem")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Remove page 2" }));

    await user.click(screen.getByRole("button", { name: "Read my form" }));

    expect(await screen.findByDisplayValue("Studio Consent")).toBeInTheDocument();
    expect(mocked.scanPaperForm).toHaveBeenCalledWith([photo]);
    expect(screen.getByRole("note")).toHaveTextContent("hard to read");
    expect(screen.getByDisplayValue("I agree")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create form" }));
    await waitFor(() =>
      expect(screen.getByTestId("where")).toHaveTextContent("/services?open=100000"),
    );
    expect(mocked.createCustomForm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Studio Consent",
        services: [100000],
        source: "scan",
        sections: [
          {
            title: "Client",
            clientInformation: true,
            fields: [
              { title: "Name", kind: "text", required: true, autofill: "client-name" },
              { title: "I agree", kind: "checkbox", required: true },
            ],
          },
        ],
      }),
    );
  });

  it("explains a failed scan and keeps the photos", async () => {
    mocked.scanPaperForm.mockRejectedValue({
      response: { data: { message: "We couldn't find a form in these photos." } },
    });
    const user = userEvent.setup();
    renderPage("/forms/new?mode=scan");
    await user.upload(
      screen.getByLabelText("Choose photos"),
      new File(["x"], "p.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByRole("button", { name: "Read my form" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't find a form");
    expect(screen.getByRole("img", { name: "Page 1" })).toBeInTheDocument();
  });

  it("points to building by hand when scanning isn't set up", async () => {
    mocked.getScanStatus.mockResolvedValue({ data: { enabled: false, maxPages: 6 } } as never);
    const user = userEvent.setup();
    renderPage("/forms/new?mode=scan");
    expect(await screen.findByText("Scanning isn't available right now")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Build it from scratch" }));
    expect(screen.getByLabelText("Form title")).toBeInTheDocument();
  });
});
