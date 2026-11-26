import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppointmentCard from "./AppointmentCard";
import { ClientAppointmentData } from "../../../redux/types";

const appointment = (
  overrides: Partial<ClientAppointmentData> = {},
): ClientAppointmentData => ({
  _id: "a",
  id: "appt-1",
  allFormsCompleted: true,
  customerId: "cust-1",
  artistId: "artist-1",
  date: "2026-11-20T05:00:00.000Z",
  services: [1],
  signed: false,
  deleted: false,
  createdAt: "2026-11-18T10:00:00.000Z",
  updatedAt: "2026-11-18T10:00:00.000Z",
  formsToFillCount: 2,
  serviceDetails: [{ _id: "s", id: 1, service: "Touch-up" }],
  ...overrides,
});

const renderCard = (data: ClientAppointmentData) => {
  const onCareAction = vi.fn();
  const onDeleteAppointment = vi.fn();
  const { container } = render(
    <AppointmentCard
      appointment={data}
      onViewForms={vi.fn()}
      onDeleteAppointment={onDeleteAppointment}
      onCareAction={onCareAction}
    />,
  );
  const menu = container.querySelector(".dropdown-menu") as HTMLElement;
  // the prompt shown on the card itself after signing
  const prompt = container.querySelector(".next-step") as HTMLElement | null;
  return { menu, prompt, onCareAction, onDeleteAppointment };
};

const menuLabels = (menu: HTMLElement) =>
  Array.from(menu.children).map((el) =>
    el.getAttribute("role") === "separator" ? "---" : el.textContent?.trim(),
  );

describe("AppointmentCard", () => {
  it("titles the card by date and shows every service as a chip", () => {
    renderCard(
      appointment({
        date: "2025-03-04T15:00:00.000Z",
        serviceDetails: [
          { _id: "s1", id: 1, service: "Microblading" },
          { _id: "s2", id: 2, service: "Lip Blush" },
          { _id: "s3", id: 100001, service: "Brow Lamination" },
        ],
      }),
    );

    const title = screen.getByRole("heading", { level: 3 });
    // another year, so the year is shown
    expect(title).toHaveTextContent(/Mar 4.*2025/);
    const chips = within(screen.getByRole("list", { name: "Services" }))
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(chips).toEqual(["Microblading", "Lip Blush", "Brow Lamination"]);
  });

  it("says when no service was recorded", () => {
    renderCard(appointment({ serviceDetails: [] }));
    expect(screen.getByText("Service not specified")).toBeInTheDocument();
  });

  it("shows signed forms as signed, not just completed", () => {
    const { prompt } = renderCard(appointment({ signed: true }));

    expect(screen.getByText("Forms Signed")).toBeInTheDocument();
    // the step after signing
    expect(
      within(prompt!).getByRole("button", { name: "Mark as complete" }),
    ).toBeInTheDocument();
  });

  it("doesn't call completed-but-unsigned forms signed", () => {
    const { prompt } = renderCard(appointment({ signed: false }));

    expect(screen.queryByText("Forms Signed")).toBeNull();
    expect(prompt).toBeNull();
  });

  it("puts Mark as complete and Delete last, after a divider", () => {
    const { menu } = renderCard(appointment({ signed: true }));

    expect(menuLabels(menu)).toEqual([
      "View Forms",
      "Send pre-care instructions",
      "Send aftercare instructions",
      "Send healing check-in",
      "---",
      "Mark as complete",
      "Delete",
    ]);
  });

  it("marks a signed appointment complete from the menu", async () => {
    const user = userEvent.setup();
    const { menu, onCareAction } = renderCard(appointment({ signed: true }));

    const complete = within(menu).getByRole("button", {
      name: "Mark as complete",
    });
    expect(complete).toBeEnabled();
    await user.click(complete);

    expect(onCareAction).toHaveBeenCalledWith("appt-1", "complete");
  });

  it("offers a healing check-in on any appointment", async () => {
    const user = userEvent.setup();
    const { menu, onCareAction } = renderCard(appointment({ signed: false }));

    await user.click(
      within(menu).getByRole("button", { name: "Send healing check-in" }),
    );

    expect(onCareAction).toHaveBeenCalledWith("appt-1", "check-in");
  });

  it("disables Mark as complete until the forms are signed", async () => {
    const user = userEvent.setup();
    const { menu, onCareAction } = renderCard(appointment({ signed: false }));

    const complete = within(menu).getByRole("button", {
      name: "Mark as complete",
    });
    expect(complete).toBeDisabled();
    expect(complete).toHaveAttribute("title", "Sign the forms first");
    await user.click(complete);

    expect(onCareAction).not.toHaveBeenCalled();
  });

  it("drops Mark as complete once the appointment is complete", () => {
    const { menu, prompt } = renderCard(
      appointment({ signed: true, completedAt: "2026-11-20T20:00:00.000Z" }),
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(prompt).toBeNull();
    expect(screen.queryByText("Mark as complete")).toBeNull();
    expect(menuLabels(menu).slice(-2)).toEqual(["---", "Delete"]);
  });

  it("offers Request payment when the page passes a handler", async () => {
    const user = userEvent.setup();
    const onRequestPayment = vi.fn();
    const { container } = render(
      <AppointmentCard
        appointment={appointment({ signed: true })}
        onViewForms={vi.fn()}
        onDeleteAppointment={vi.fn()}
        onCareAction={vi.fn()}
        onRequestPayment={onRequestPayment}
      />,
    );
    const menu = container.querySelector(".dropdown-menu") as HTMLElement;

    // with the other client actions, above the divider
    expect(menuLabels(menu)).toEqual([
      "View Forms",
      "Send pre-care instructions",
      "Send aftercare instructions",
      "Send healing check-in",
      "Request payment",
      "---",
      "Mark as complete",
      "Delete",
    ]);
    await user.click(within(menu).getByRole("button", { name: "Request payment" }));
    expect(onRequestPayment).toHaveBeenCalledWith("appt-1");
  });

  it("has no Request payment without a handler (no Square)", () => {
    const { menu } = renderCard(appointment({ signed: true }));
    expect(within(menu).queryByRole("button", { name: "Request payment" })).toBeNull();
  });
});
