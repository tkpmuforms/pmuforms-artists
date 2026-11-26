import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

const auth = vi.hoisted(() => ({ isMember: false }));

vi.mock("../../../context/useAuth.ts", () => ({
  default: () => ({
    isMember: auth.isMember,
    user: {
      userId: "artist-1",
      firstName: "Ada",
      businessName: "Brow Studio",
      avatarUrl: "https://example.com/photo.jpg",
    },
    logout: vi.fn(),
  }),
}));

describe("Sidebar", () => {
  it("shows the support email as text to copy, next to Logout, with no mail link", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    // nothing opens the mail app (Outlook) in place of PMU Forms
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();

    const email = screen.getByText("contact@pmuforms.com");
    expect(email.closest("a, button")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Copy support email" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("contact@pmuforms.com"));
    expect(await screen.findByRole("button", { name: "Support email copied" })).toBeInTheDocument();

    // directly above the logout button
    const support = container.querySelector(".sidebar__support");
    expect(support?.nextElementSibling).toBe(screen.getByRole("button", { name: /Logout/ }));
  });

  it("opens the contact page inside the app", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="*" element={<Sidebar />} />
          <Route path="/contact-us" element={<p>Contact page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Need help?" }));
    expect(screen.getByText("Contact page")).toBeInTheDocument();
  });

  it("shows the business name without a logo or photo", () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Brow Studio" })).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("hides the owner's areas from a team member", () => {
    auth.isMember = true;
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    auth.isMember = false;
    expect(screen.queryByRole("button", { name: /Integrations/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Refer/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Clients/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Settings/ })).toBeInTheDocument();
  });
});
