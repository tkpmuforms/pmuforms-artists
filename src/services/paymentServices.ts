import axiosInstance from "../utils/axios/axiosSetup";

export type PaymentRequestKind = "deposit" | "payment";
export type PaymentRequestStatus = "pending" | "paid" | "refunded" | "canceled";

export interface PaymentRequest {
  id: string;
  appointmentId: string;
  customerId: string;
  kind: PaymentRequestKind;
  status: PaymentRequestStatus;
  /** decimal text, e.g. "49.99" */
  amount: string;
  /** formatted, e.g. "$49.99" */
  amountLabel: string;
  currency: string;
  title: string;
  note: string | null;
  /** the Square link; only while waiting for payment */
  url: string | null;
  amountPaid: string | null;
  amountRefunded: string | null;
  receiptUrl: string | null;
  paidAt: string | null;
  sentTo: string | null;
  lastSentAt: string | null;
  canceledAt: string | null;
  createdAt: string;
}

export interface SquarePaymentStatus {
  connected: boolean;
  /** connected before payments existed, or the connection broke */
  reconnectRequired: boolean;
  paymentsEnabled: boolean;
  accountName: string | null;
  locationName: string | null;
  currency: string | null;
}

export interface CreatePaymentRequestInput {
  appointmentId: string;
  kind: PaymentRequestKind;
  amount: string;
  note?: string;
  sendEmail: boolean;
  requestId: string;
}

export const getSquarePaymentStatus = () =>
  axiosInstance.get<SquarePaymentStatus>("/api/payment-requests/square-status");

export const getPaymentRequests = (appointmentId: string) =>
  axiosInstance.get<{ requests: PaymentRequest[] }>("/api/payment-requests", {
    params: { appointmentId },
  });

export const createPaymentRequest = (input: CreatePaymentRequestInput) =>
  axiosInstance.post<{
    request: PaymentRequest;
    emailSent: boolean;
    emailError?: string | null;
  }>("/api/payment-requests", input);

export const resendPaymentRequest = (id: string) =>
  axiosInstance.post<{ request: PaymentRequest }>(
    `/api/payment-requests/${encodeURIComponent(id)}/send`,
  );

export const refreshPaymentRequest = (id: string) =>
  axiosInstance.post<{ request: PaymentRequest }>(
    `/api/payment-requests/${encodeURIComponent(id)}/refresh`,
  );

export const cancelPaymentRequest = (id: string) =>
  axiosInstance.post<{ request: PaymentRequest }>(
    `/api/payment-requests/${encodeURIComponent(id)}/cancel`,
  );
