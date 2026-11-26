import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { describe, expect, it, vi } from "vitest";
import AddClientModal from "./AddClientModal";
import * as api from "../../services/artistServices";

vi.mock("../../services/artistServices", () => ({ createClient: vi.fn() }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe("AddClientModal", () => {
  it("shows the API's reason when a client can't be added", async () => {
    // what axiosSetup's interceptor rejects with: the response body
    vi.mocked(api.createClient).mockRejectedValue({
      statusCode: 400,
      error: "Bad Request",
      message: "Client already exists",
    });
    const user = userEvent.setup();
    render(<AddClientModal onClose={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("First Name"), "Jane");
    await user.type(screen.getByPlaceholderText("Last Name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email Address"), "jane@x.com");
    await user.click(screen.getByRole("button", { name: "Add Client" }));

    expect(toast.error).toHaveBeenCalledWith("Client already exists");
  });
});
