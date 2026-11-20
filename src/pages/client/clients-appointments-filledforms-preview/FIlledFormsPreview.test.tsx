import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FilledFormsPreview from "./FIlledFormsPreview";
import * as api from "../../../services/artistServices";

vi.mock("../../../services/artistServices", () => ({
  getAppointmentById: vi.fn(),
  getFilledFormByAppointmentAndTemplate: vi.fn(),
  getFilledFormsByAppointment: vi.fn(),
  getFormById: vi.fn(),
}));
vi.mock("../../../context/useAuth", () => ({
  default: () => ({
    user: {
      businessName: "Brow Studio",
      signature_url: "https://storage.example.com/artist.png",
    },
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mocked = vi.mocked(api);

const consentTemplate = {
  id: "consent-1",
  title: "Consent for {{user.businessName}}",
  sections: [
    {
      id: "s1",
      title: "Agreement",
      data: [{ id: "q1", title: "Full name", type: "text" }],
    },
  ],
};
const historyTemplate = {
  id: "history-1",
  title: "Medical History",
  sections: [
    {
      id: "s2",
      title: "Health",
      data: [{ id: "q2", title: "Allergies", type: "text" }],
    },
    // skipped sections stay out of the preview and the PDF
    { id: "s3", title: "Hidden section", skip: true, data: [] },
  ],
};

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/clients/:id/appointments/:appointmentId/forms/all"
          element={<FilledFormsPreview />}
        />
        <Route
          path="/clients/:id/appointments/:appointmentId/forms/:templateId"
          element={<FilledFormsPreview />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

// jsdom never loads images; fail fast so signatures fall back to their URL
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin = "";
  set src(_value: string) {
    setTimeout(() => this.onerror?.());
  }
}

describe("FilledFormsPreview", () => {
  beforeEach(() => {
    mocked.getAppointmentById.mockResolvedValue({
      data: {
        appointment: {
          signed: true,
          signature_url: "https://storage.example.com/client.png",
        },
      },
    } as never);
    mocked.getFilledFormsByAppointment.mockResolvedValue({
      data: {
        filledForms: [
          { id: "f1", data: { q1: "Jane Doe" }, formTemplate: consentTemplate },
          { id: "f2", data: { q2: "Latex" }, formTemplate: historyTemplate },
        ],
      },
    } as never);
    vi.stubGlobal("Image", FakeImage);
  });

  it("shows every form with its answers on the all-forms page", async () => {
    renderAt("/clients/cust-1/appointments/appt-1/forms/all");

    expect(await screen.findByText("All forms (2)")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Consent for Brow Studio" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Medical History" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Latex")).toBeInTheDocument();
    expect(screen.queryByText("Hidden section")).toBeNull();
    // one PDF for everything, not one per form
    expect(
      screen.getAllByRole("button", { name: /pdf/i }),
    ).toHaveLength(1);
  });

  it("puts every form in the PDF, with the signatures once at the end", async () => {
    const write = vi.fn();
    const printWindow = {
      document: { write, close: vi.fn() },
      print: vi.fn(),
      close: vi.fn(),
    };
    vi.spyOn(window, "open").mockReturnValue(printWindow as never);
    const user = userEvent.setup();
    renderAt("/clients/cust-1/appointments/appt-1/forms/all");

    await user.click(
      await screen.findByRole("button", { name: "Download all as PDF" }),
    );

    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const html: string = write.mock.calls[0][0];
    expect(html).toContain("Consent for Brow Studio");
    expect(html).toContain("Medical History");
    expect(html).toContain('value="Jane Doe"');
    expect(html).toContain('value="Latex"');
    expect(html).not.toContain("Hidden section");
    expect(html.match(/Customer Signature<\/h4>/g)).toHaveLength(1);
    expect(html.match(/Artist Signature<\/h4>/g)).toHaveLength(1);
    expect(html).toContain("https://storage.example.com/client.png");
    // the on-screen info banner and button are not part of the document
    expect(html).not.toContain("Filled Form Data");
    expect(html).not.toContain("Download all as PDF");
  });

  it("tells the artist when pop-ups block the PDF", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const user = userEvent.setup();
    renderAt("/clients/cust-1/appointments/appt-1/forms/all");

    await user.click(
      await screen.findByRole("button", { name: "Download all as PDF" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Please allow pop-ups to generate PDF",
      ),
    );
  });

  it("shows a single form with a link to all the forms", async () => {
    mocked.getFormById.mockResolvedValue({
      data: { form: historyTemplate },
    } as never);
    mocked.getFilledFormByAppointmentAndTemplate.mockResolvedValue({
      data: { filledForm: { data: { q2: "Latex" } } },
    } as never);
    renderAt("/clients/cust-1/appointments/appt-1/forms/history-1");

    expect(
      await screen.findByRole("heading", { name: "Medical History" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Consent for Brow Studio")).toBeNull();
    expect(
      screen.getByRole("link", { name: "See all forms for this appointment" }),
    ).toHaveAttribute("href", "/clients/cust-1/appointments/appt-1/forms/all");
  });
});
