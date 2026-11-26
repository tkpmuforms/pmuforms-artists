import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessInformationPage from "./BusinessInformationPage";
import * as api from "../../../services/artistServices";
import { toE164USPhone, validateUSPhone } from "../../../utils/ownerDetails";

vi.mock("../../../services/artistServices", () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  updateMySignature: vi.fn(),
  updateBusinessInfo: vi.fn(),
}));
const auth = vi.hoisted(() => ({
  services: [] as { id: number; service: string }[],
}));
vi.mock("../../../context/useAuth", () => ({
  default: () => ({
    user: {
      _id: "u1",
      email: "owner@glowstudio.com",
      businessName: "Glow Studio",
      businessPhoneNumber: "(512) 555-0100",
      businessAddress: "1 Main St",
      website: "glow.com",
      services: auth.services,
    },
  }),
}));
vi.mock("react-redux", () => ({ useDispatch: () => vi.fn() }));
vi.mock("../../../utils/authUtils", () => ({ refreshAuthUser: vi.fn() }));
vi.mock("../../../firebase/firebase", () => ({ storage: {} }));
vi.mock("../../../components/profile/UpdateServicesModal", () => ({
  default: () => null,
}));
vi.mock("../../../components/clients/signature/SignatureModal", () => ({
  default: () => <p>Signature pad</p>,
}));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mocked = vi.mocked(api);

describe("Business Information page: owner's details", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getMyProfile.mockResolvedValue({
      data: {
        profile: { firstName: "Tia", lastName: "Kane", phoneNumber: "+15125550199" },
      },
    } as never);
  });

  it("shows the owner apart from the business, with the owner's email", async () => {
    render(<BusinessInformationPage />);

    const owner = screen.getByRole("region", { name: "Owner's details" });
    expect(await within(owner).findByText("Tia Kane")).toBeInTheDocument();
    expect(within(owner).getByText("+1 (512) 555-0199")).toBeInTheDocument();
    expect(within(owner).getByText("Owner's Email")).toBeInTheDocument();
    expect(within(owner).getByText("owner@glowstudio.com")).toBeInTheDocument();
    expect(within(owner).getByText("Not added yet")).toBeInTheDocument();

    // the sign-in email belongs to the owner, not the business
    const business = screen.getByRole("region", { name: "Business details" });
    expect(within(business).queryByText("owner@glowstudio.com")).toBeNull();
  });

  it("saves the owner's details with the phone in international format", async () => {
    mocked.updateMyProfile.mockResolvedValue({} as never);
    const user = userEvent.setup();
    render(<BusinessInformationPage />);

    await user.click(
      await screen.findByRole("button", { name: /Edit Owner's Details/ }),
    );
    const dialog = screen.getByRole("dialog", { name: "Edit owner's details" });
    expect(within(dialog).getByLabelText("Owner's Email")).toBeDisabled();

    const first = within(dialog).getByLabelText("First Name *");
    await user.clear(first);
    await user.type(first, "Tina");
    const phone = within(dialog).getByLabelText("Owner's Phone Number (USA)");
    await user.clear(phone);
    await user.type(phone, "5125550142");
    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(mocked.updateMyProfile).toHaveBeenCalledWith({
        firstName: "Tina",
        lastName: "Kane",
        phoneNumber: "+15125550142",
      }),
    );
    expect(await screen.findByText("Tina Kane")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("won't save without a valid name", async () => {
    const user = userEvent.setup();
    render(<BusinessInformationPage />);

    await user.click(
      await screen.findByRole("button", { name: /Edit Owner's Details/ }),
    );
    const dialog = screen.getByRole("dialog", { name: "Edit owner's details" });
    await user.clear(within(dialog).getByLabelText("Last Name *"));
    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }));

    expect(within(dialog).getByText("This field is required")).toBeInTheDocument();
    expect(mocked.updateMyProfile).not.toHaveBeenCalled();
  });

  it("opens the signature pad from the owner's section", async () => {
    const user = userEvent.setup();
    render(<BusinessInformationPage />);

    await user.click(await screen.findByRole("button", { name: /Add Signature/ }));
    expect(screen.getByText("Signature pad")).toBeInTheDocument();
  });
});

describe("owner phone numbers", () => {
  it("accepts US numbers and sends them in international format", () => {
    expect(validateUSPhone("")).toBeUndefined();
    expect(validateUSPhone("(512) 555-0142")).toBeUndefined();
    expect(validateUSPhone("1 512 555 0142")).toBeUndefined();
    expect(validateUSPhone("012 555 0142")).toBe("Invalid area code");
    expect(validateUSPhone("512 055 0142")).toBe("Invalid phone number format");
    expect(validateUSPhone("555 0142")).toMatch(/valid USA phone/);
    expect(toE164USPhone("(512) 555-0142")).toBe("+15125550142");
    expect(toE164USPhone("+1 (512) 555-0142")).toBe("+15125550142");
    expect(toE164USPhone("")).toBe("");
  });

  it("keeps a long services list short, with a way to show them all", async () => {
    mocked.getMyProfile.mockResolvedValue({ data: { profile: {} } } as never);
    auth.services = Array.from({ length: 31 }, (_, i) => ({
      id: i + 1,
      service: `Service ${i + 1}`,
    }));
    const user = userEvent.setup();
    render(<BusinessInformationPage />);

    const list = screen.getByRole("list", { name: "Registered services" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(12);
    expect(screen.getByText("Registered Services (31)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Edit Business Services/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show all 31 services" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(31);
    await user.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(12);
    auth.services = [];
  });
});
