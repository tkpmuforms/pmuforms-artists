import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditBusinessInformationModal from "./EditBusinessInformationModal";
import * as api from "../../services/artistServices";

vi.mock("../../context/useAuth", () => ({
  default: () => ({ user: { businessName: "New Business" } }),
}));
vi.mock("react-redux", () => ({ useDispatch: () => vi.fn() }));
vi.mock("../../utils/authUtils", () => ({ refreshAuthUser: vi.fn() }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../../services/artistServices", () => ({
  updateBusinessInfo: vi.fn(),
  updateHeardFrom: vi.fn(),
}));

const mocked = vi.mocked(api);

const fillName = async (user: ReturnType<typeof userEvent.setup>) =>
  user.type(screen.getByLabelText("Business Name"), "Glow Studio");

describe('"How did you hear about PMU Forms?" in onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.updateBusinessInfo.mockResolvedValue({} as never);
    mocked.updateHeardFrom.mockResolvedValue({} as never);
  });

  it("saves the answer with the business details", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <EditBusinessInformationModal onClose={vi.fn()} onSave={onSave} askHeardFrom />,
    );
    await fillName(user);
    await user.selectOptions(
      screen.getByLabelText(/How did you hear about PMU Forms/),
      "another_artist",
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(mocked.updateHeardFrom).toHaveBeenCalledWith({
      heardFrom: "another_artist",
    });
  });

  it('sends the "Other" text only with "Other"', async () => {
    const user = userEvent.setup();
    render(
      <EditBusinessInformationModal onClose={vi.fn()} onSave={vi.fn()} askHeardFrom />,
    );
    await fillName(user);
    expect(screen.queryByLabelText("Where did you hear about us?")).toBeNull();
    await user.selectOptions(
      screen.getByLabelText(/How did you hear about PMU Forms/),
      "other",
    );
    await user.type(
      screen.getByLabelText("Where did you hear about us?"),
      "  A brow class ",
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(mocked.updateHeardFrom).toHaveBeenCalledWith({
        heardFrom: "other",
        heardFromOther: "A brow class",
      }),
    );
  });

  it("is optional, and a failure never blocks onboarding", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(
      <EditBusinessInformationModal onClose={vi.fn()} onSave={onSave} askHeardFrom />,
    );
    await fillName(user);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(mocked.updateHeardFrom).not.toHaveBeenCalled();
    unmount();

    // the API refuses it: onboarding goes on, the error is only logged
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocked.updateHeardFrom.mockRejectedValue(new Error("network"));
    const onSave2 = vi.fn();
    render(
      <EditBusinessInformationModal onClose={vi.fn()} onSave={onSave2} askHeardFrom />,
    );
    await fillName(user);
    await user.selectOptions(
      screen.getByLabelText(/How did you hear about PMU Forms/),
      "google",
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(onSave2).toHaveBeenCalled());
  });

  it("isn't asked when editing business details later", () => {
    render(<EditBusinessInformationModal onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByLabelText(/How did you hear about PMU Forms/)).toBeNull();
  });
});
