import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as artistApi from "../../services/artistServices";
import ContactUs from "./contactUs";

vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof artistApi>()),
  sendMessage: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
let user: { email?: string; firstName?: string; lastName?: string } = {};
vi.mock("../../context/useAuth", () => ({ default: () => ({ user }) }));

const mocked = vi.mocked(artistApi);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.sendMessage.mockResolvedValue({ data: {} } as never);
});

describe("Help & Support form", () => {
  it("doesn't show the email, but still sends the account's email", async () => {
    user = { email: "ada@example.com", firstName: "Ada", lastName: "Obi" };
    const typist = userEvent.setup();
    render(<ContactUs />);

    expect(screen.queryByLabelText(/Email/)).toBeNull();
    expect(screen.queryByDisplayValue("ada@example.com")).toBeNull();
    // "Name", not "First Name", filled with the whole name
    expect(screen.queryByText(/First Name/i)).toBeNull();
    expect(screen.getByLabelText("Name:")).toHaveValue("Ada Obi");

    await typist.type(screen.getByLabelText(/Subject/), "Help");
    await typist.type(screen.getByLabelText(/Message/), "Forms won't load");
    await typist.click(screen.getByRole("button", { name: /send|submit/i }));

    expect(mocked.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
        firstName: "Ada Obi",
        subject: "Help",
      }),
    );
  });

  it("asks for an email when the account has none", () => {
    user = { firstName: "Ada" };
    render(<ContactUs />);
    expect(screen.getByLabelText(/Email/)).toBeRequired();
  });
});
