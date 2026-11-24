import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

vi.mock("../../../context/useAuth.ts", () => ({
  default: () => ({
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

  it("shows the business name without a logo or photo", () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Brow Studio" })).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});
