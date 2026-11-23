import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

vi.mock("../../../context/useAuth.ts", () => ({
  default: () => ({ user: { userId: "artist-1", firstName: "Ada" }, logout: vi.fn() }),
}));

describe("Sidebar", () => {
  it("shows the support email next to Logout", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Need help? Email contact@pmuforms.com" });
    expect(link).toHaveAttribute("href", "mailto:contact@pmuforms.com");
    expect(link).toHaveTextContent("contact@pmuforms.com");
    // directly above the logout button
    expect(link.nextElementSibling).toBe(screen.getByRole("button", { name: /Logout/ }));
  });
});
