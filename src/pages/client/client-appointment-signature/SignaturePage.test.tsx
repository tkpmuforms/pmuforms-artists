import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignFormsPage from "./SignaturePage";
import * as api from "../../../services/artistServices";

vi.mock("../../../services/artistServices", () => ({
  getAppointmentById: vi.fn(),
  getFilledFormsByAppointment: vi.fn(),
  getCustomerById: vi.fn(),
  signAppointment: vi.fn(),
}));
vi.mock("../../../context/useAuth", () => ({
  default: () => ({ user: { _id: "artist-1" } }),
}));
vi.mock("../../../firebase/firebase", () => ({ storage: {} }));
vi.mock("firebase/storage", () => ({
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(async () => ({ ref: {} })),
  getDownloadURL: vi.fn(async () => "https://storage.example.com/sig.png"),
}));
vi.mock("browser-image-compression", () => ({
  default: vi.fn(async (file: File) => file),
}));
// the real modal draws on a canvas; this one submits straight away
vi.mock("../../../components/clients/signature/SignatureModal", () => ({
  default: ({ onSubmit }: { onSubmit: (url: string) => Promise<void> }) => (
    <div role="dialog" aria-label="Signature pad">
      <button onClick={() => onSubmit("data:image/png;base64,AAAA")}>
        Submit signature
      </button>
    </div>
  ),
}));

const mocked = vi.mocked(api);

const appointment = (overrides: Record<string, unknown> = {}) => ({
  id: "appt-1",
  date: "2026-11-20T05:00:00.000Z",
  serviceDetails: [{ id: 1, service: "Microblading" }],
  allFormsCompleted: true,
  signed: false,
  ...overrides,
});

const filledForms = [
  { id: "f1", title: "Consent", status: "completed" },
  { id: "f2", title: "Medical History", status: "completed" },
];

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        path: "/clients/:id/appointments/:appointmentId/signature",
        element: <SignFormsPage />,
      },
      {
        path: "/clients/:id/appointments/:appointmentId/forms/all",
        element: <p>All forms page</p>,
      },
    ],
    {
      initialEntries: [
        {
          pathname: "/clients/cust-1/appointments/appt-1/signature",
          state: { clientName: "Jane Doe" },
        },
      ],
    },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const signButton = () =>
  screen.findByRole("button", { name: /sign appointment forms|already signed|submitting/i });

describe("SignaturePage", () => {
  beforeEach(() => {
    mocked.getFilledFormsByAppointment.mockResolvedValue({
      data: { filledForms },
    } as never);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ blob: async () => new Blob(["sig"]) })),
    );
  });

  it("reads the signed status from the API, so a signed appointment can't be signed again", async () => {
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: appointment({ signed: true }) },
    } as never);
    const user = userEvent.setup();
    renderPage();

    const button = await signButton();
    expect(button).toHaveTextContent("Already Signed");
    expect(button).toBeDisabled();

    await user.click(button);
    expect(screen.queryByRole("dialog", { name: "Signature pad" })).toBeNull();
    expect(
      screen.getByText("These forms are signed and can no longer be changed."),
    ).toBeInTheDocument();
  });

  it("can't be signed until every form is complete", async () => {
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: appointment({ allFormsCompleted: false }) },
    } as never);
    renderPage();

    expect(await signButton()).toBeDisabled();
  });

  it("signs once, offers the next step, then lands on all the forms", async () => {
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: appointment() },
    } as never);
    mocked.signAppointment.mockResolvedValue({} as never);
    const user = userEvent.setup();
    const router = renderPage();

    await user.click(await signButton());
    await user.click(screen.getByRole("button", { name: "Submit signature" }));

    expect(mocked.signAppointment).toHaveBeenCalledTimes(1);
    expect(mocked.signAppointment).toHaveBeenCalledWith("appt-1", {
      signatureUrl: "https://storage.example.com/sig.png",
    });

    // the next step after signing
    expect(
      await screen.findByRole("dialog", { name: "Forms signed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("What's next for Jane Doe?")).toBeInTheDocument();
    // and the page itself no longer offers signing
    expect(
      screen.getByRole("button", { name: /already signed/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Not now" }));

    expect(await screen.findByText("All forms page")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      "/clients/cust-1/appointments/appt-1/forms/all",
    );
    // replaced, so Back skips the signing page
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("ignores a second submit while the first is still saving", async () => {
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: appointment() },
    } as never);
    let finish: () => void = () => {};
    mocked.signAppointment.mockReturnValue(
      new Promise((resolve) => {
        finish = () => resolve({} as never);
      }) as never,
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await signButton());
    const submit = screen.getByRole("button", { name: "Submit signature" });
    await user.click(submit);
    await user.click(submit);

    await waitFor(() =>
      expect(mocked.signAppointment).toHaveBeenCalledTimes(1),
    );
    finish();
    expect(
      await screen.findByRole("dialog", { name: "Forms signed" }),
    ).toBeInTheDocument();
    expect(mocked.signAppointment).toHaveBeenCalledTimes(1);
  });

  it("keeps signing available when saving the signature fails", async () => {
    mocked.getAppointmentById.mockResolvedValue({
      data: { appointment: appointment() },
    } as never);
    mocked.signAppointment.mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    renderPage();

    await user.click(await signButton());
    await user.click(screen.getByRole("button", { name: "Submit signature" }));

    expect(
      await screen.findByText("Failed to submit signature. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Forms signed" })).toBeNull();
    expect(
      screen.getByRole("button", { name: /sign appointment forms/i }),
    ).toBeEnabled();
  });
});
