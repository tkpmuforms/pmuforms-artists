import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteAccountModal, { DELETE_CONFIRM_WORD } from "./DeleteAccountModal";
import { deleteMe } from "../../services/artistServices";

vi.mock("../../services/artistServices", () => ({ deleteMe: vi.fn() }));
const mockedDeleteMe = vi.mocked(deleteMe);

const onClose = vi.fn();
const onDeleted = vi.fn();
const renderModal = (storeSubscription = false) =>
  render(
    <DeleteAccountModal
      onClose={onClose}
      onDeleted={onDeleted}
      storeSubscription={storeSubscription}
    />,
  );
const deleteButton = () =>
  screen.getByRole("button", { name: "Delete my account" });
const typeConfirm = (value: string) =>
  fireEvent.change(
    screen.getByLabelText(`Type ${DELETE_CONFIRM_WORD} to confirm`),
    {
      target: { value },
    },
  );

beforeEach(() => vi.clearAllMocks());

describe("deleting your account", () => {
  it("says what goes, and stays disabled until DELETE is typed", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "Delete your account?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/subscription is cancelled right away/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/download or print your signed forms first/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/App Store or Google Play/)).toBeNull();
    expect(deleteButton()).toBeDisabled();

    typeConfirm("delet");
    expect(deleteButton()).toBeDisabled();
    typeConfirm("delete");
    expect(deleteButton()).toBeEnabled();
  });

  it("deletes the account, then signs out", async () => {
    mockedDeleteMe.mockResolvedValueOnce({} as never);
    renderModal();
    typeConfirm(DELETE_CONFIRM_WORD);
    fireEvent.click(deleteButton());

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(mockedDeleteMe).toHaveBeenCalledTimes(1);
  });

  it("shows the API's reason and keeps the account when it fails", async () => {
    mockedDeleteMe.mockRejectedValueOnce({
      message:
        "We couldn't cancel your subscription, so your account wasn't deleted.",
      statusCode: 400,
    });
    renderModal();
    typeConfirm(DELETE_CONFIRM_WORD);
    fireEvent.click(deleteButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't cancel your subscription",
    );
    expect(onDeleted).not.toHaveBeenCalled();
    expect(deleteButton()).toBeEnabled();
  });

  it("tells store subscribers to cancel in their store too", () => {
    renderModal(true);
    expect(screen.getByText(/App Store or Google Play/)).toBeInTheDocument();
  });
});
