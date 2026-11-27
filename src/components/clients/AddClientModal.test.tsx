import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { describe, expect, it, vi } from "vitest";
import AddClientModal from "./AddClientModal";
import * as api from "../../services/artistServices";

vi.mock("../../services/artistServices", () => ({ createClient: vi.fn() }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
const auth = vi.hoisted(() => ({ isMember: false }));
vi.mock("../../context/useAuth", () => ({ default: () => auth }));

const LIMIT_MESSAGE =
  "You've reached the 10-client limit on the Starter plan. Upgrade to Pro for unlimited clients, or delete a client you no longer need.";

const addJane = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText("First Name"), "Jane");
  await user.type(screen.getByPlaceholderText("Last Name"), "Doe");
  await user.type(screen.getByPlaceholderText("Email Address"), "jane@x.com");
  await user.click(screen.getByRole("button", { name: "Add Client" }));
};

const renderInApp = () =>
  render(
    <MemoryRouter initialEntries={["/clients"]}>
      <Routes>
        <Route path="/clients" element={<AddClientModal onClose={vi.fn()} />} />
        <Route path="/profile/payment" element={<p>Payment page</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("AddClientModal", () => {
  it("explains Starter's client limit with a way to upgrade, instead of an error", async () => {
    auth.isMember = false;
    vi.mocked(api.createClient).mockRejectedValue({
      statusCode: 403,
      message: LIMIT_MESSAGE,
      code: "STARTER_CLIENT_LIMIT",
      kind: "clients",
      limit: 10,
    });
    const user = userEvent.setup();
    renderInApp();
    await addJane(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(LIMIT_MESSAGE);
    expect(toast.error).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    expect(screen.getByText("Payment page")).toBeInTheDocument();
  });

  it("tells a team member at the limit to ask the account owner", async () => {
    auth.isMember = true;
    vi.mocked(api.createClient).mockRejectedValue({
      statusCode: 403,
      message: LIMIT_MESSAGE,
      code: "STARTER_CLIENT_LIMIT",
      kind: "clients",
      limit: 10,
    });
    const user = userEvent.setup();
    renderInApp();
    await addJane(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ask the account owner to upgrade to Pro.",
    );
    expect(screen.queryByRole("button", { name: "Upgrade to Pro" })).toBeNull();
  });

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
