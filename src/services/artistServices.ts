import axiosInstance from "../utils/axios/axiosSetup";
import { type Attribution, readAttribution } from "../utils/attribution";

/**
 * Signs in, creating the account the first time. `signup` (where the artist
 * came from) is only used by the API when it creates the account.
 */
export const createArtist = async (
  accessToken: string,
  signup?: { attribution?: Attribution | null; platform?: "web" },
) =>
  axiosInstance.post("/api/auth/artist/create", {
    accessToken,
    ...(signup?.attribution ? { attribution: signup.attribution } : {}),
    ...(signup?.platform ? { platform: signup.platform } : {}),
  });

/** For sign-ins from this web app's login page. */
export const webSignup = () => ({
  attribution: readAttribution(),
  platform: "web" as const,
});

export interface ReferralSummary {
  code: string;
  link: string;
  rewardCents: number;
  invited: number;
  paid: number;
  rewardsEarned: number;
  creditEarnedCents: number;
  maxRewardsPerYear: number;
  /** this artist was invited and their discount is still unused */
  referralDiscountAvailable: boolean;
}

export const getReferralSummary = async () =>
  axiosInstance.get<ReferralSummary>("/api/referrals/me");

export const updateServices = async (data: { services: number[] }) =>
  axiosInstance.put("/api/services/update-services", data);

export const getServices = async () => axiosInstance.get("/api/services");

export const getServiceById = async (serviceId: number | string) =>
  axiosInstance.get(`/api/services/${serviceId}`);

export const getAuthMe = async () => axiosInstance.get("/api/auth/me");

export const getIntegrations = async () =>
  axiosInstance.get("/api/integrations/");

export const disconnectSquare = async () =>
  axiosInstance.delete("/api/integrations/square");

export const getSquareConnectUrl = async () =>
  axiosInstance.get("/api/integrations/square/connect");

export const getSquareServices = async () =>
  axiosInstance.get("/api/integrations/square/services");

export interface SquareMappingRequest {
  pmuServiceId: number;
  squareServiceId: string;
  squareVariationId: string;
  enabled: boolean;
}

export const getSquareMappings = async () =>
  axiosInstance.get("/api/integrations/square/mappings");

// Replaces the full set of mappings; the body is the array itself.
export const saveSquareMappings = async (mappings: SquareMappingRequest[]) =>
  axiosInstance.put("/api/integrations/square/mappings", mappings);

export const updateBusinessName = async (data: { businessName: string }) =>
  axiosInstance.patch("/api/artists/update-business-name", data);

export const sendEmailVerification = async (uid: string) =>
  axiosInstance.get(`/api/auth/send-email-verification/${uid}`);

export const getAppointmentsForCustomer = async (customerId: string) =>
  axiosInstance.get(`/api/appointments/artist/one-customer/${customerId}`);

export const getArtistAppointments = async () =>
  axiosInstance.get("/api/appointments/artist");
export interface AppointmentFilters {
  /** part of a client's name or email, or of a service name */
  search?: string;
  /** pending: forms not signed; signed: signed, not done; completed: done */
  status?: "pending" | "signed" | "completed";
  service?: number;
  /** ISO dates: on or after `from`, before `to` */
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
}

export const getArtistAppointmentsPaginated = async (
  page: number = 1,
  perPage: number = 10,
  filters: AppointmentFilters = {},
) => {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return axiosInstance.get(`/api/appointments/artist?${params.toString()}`);
};

export interface FormLink {
  url: string;
  expiresAt: string;
}

// A no-login link to one appointment's forms in the customer app. Each link
// lasts 24 hours from when it is generated.
export const createFormLink = async (appointmentId: string) =>
  axiosInstance.post<FormLink>("/api/form-links", { appointmentId });

export const bookAppointment = async (data: {
  appointmentDate: string;
  customerId: string;
  services: number[];
  // lets the API email the client at sensible local hours
  timeZone?: string;
}) =>
  axiosInstance.post(
    "/api/appointments/artist/book-appointment?notify_customer=1",
    data,
  );

export const sendMessage = async (data: {
  email: string;
  firstName: string;
  subject: string;
  message: string;
}) => axiosInstance.post("/api/messages", data);

export const getFilledFormsByAppointment = async (
  appointmentId: string | number,
) => axiosInstance.get(`/api/filled-forms/appointment/${appointmentId}`);

export const getFilledFormByAppointmentAndTemplate = async (
  appointmentId: string,
  formTemplateId: string,
) =>
  axiosInstance.get(
    `/api/filled-forms/appointment/${appointmentId}/form/${formTemplateId}`,
  );

export const getFormsByAppointment = async (appointmentId: string | number) =>
  axiosInstance.get(`/api/forms/appointment/${appointmentId}`);

export const getFormById = async (formTemplateId: string | number) =>
  axiosInstance.get(`/api/forms/${formTemplateId}`);

export const updateFormServices = async (
  formTemplateId: string | number,
  data: { services: number[] },
) => axiosInstance.put(`/api/forms/${formTemplateId}/update-services`, data);

export const getMyForms = async () => axiosInstance.get("/forms/my-forms");

export const deleteFormTemplate = async (formTemplateId: string | number) =>
  axiosInstance.delete(`/api/forms/${formTemplateId}/delete`);

export const updateFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  dataId: string | number,
  data: Record<string, unknown>,
) =>
  axiosInstance.patch(
    `/api/forms/${formTemplateId}/sections/${sectionId}/data/${dataId}/update`,
    data,
  );

export const deleteFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  dataId: string | number,
) =>
  axiosInstance.delete(
    `/api/forms/${formTemplateId}/sections/${sectionId}/data/${dataId}`,
  );

export const addFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  data: Record<string, unknown>,
) =>
  axiosInstance.post(
    `/api/forms/${formTemplateId}/sections/${sectionId}`,
    data,
  );

export const updateArtistFcmToken = async (data: { fcmToken: string }) =>
  axiosInstance.patch("/api/artists/update-fcm-token", data);

export const getArtistById = async (artistId: string | number) =>
  axiosInstance.get(`/api/artists/${artistId}`);

export const getArtistUrl = async (artistId: string | number) =>
  axiosInstance.get(`/api/artists/${artistId}/url`);

export const deleteMe = async () =>
  axiosInstance.delete("/api/artists/delete-me");

export const signAppointment = async (
  appointmentId: string | number,
  data: { signatureUrl: string },
) => axiosInstance.post(`/api/appointments/${appointmentId}/sign`, data);

export const getMyCustomers = async (page?: number) => {
  const params = page ? `?page=${page}` : "";
  return axiosInstance.get(`/api/customers/my-customers${params}`);
};

export const getCustomerById = async (customerId: string) =>
  axiosInstance.get(`/api/customers/my-customers/${customerId}`);

export const deleteCustomer = async (customerId: string) =>
  axiosInstance.delete(`/api/customers/my-customers/${customerId}`);

export const addCustomerNote = async (
  customerId: string | number,
  data: { note: string; imageUrl?: string },
) =>
  axiosInstance.post(`/api/customers/my-customers/${customerId}/notes`, data);

export const getCustomerNotes = async (customerId: string) =>
  axiosInstance.get(`/api/customers/my-customers/${customerId}/notes`);

export const updateCustomerNote = async (
  customerId: string | number,
  noteId: string | number,
  data: { note: string; imageUrl?: string },
) =>
  axiosInstance.put(
    `/api/customers/my-customers/${customerId}/notes/${noteId}`,
    data,
  );

export const deleteCustomerNote = async (
  customerId: string | number,
  noteId: string | number,
) =>
  axiosInstance.delete(
    `/api/customers/my-customers/${customerId}/notes/${noteId}`,
  );

export type ClientActivity =
  | "upcoming"
  | "no-upcoming"
  | "lapsed"
  | "never"
  | "new";
export type ClientSort = "name" | "recent" | "last-visit" | "next";

export interface ClientFilters {
  activity?: ClientActivity;
  /** clients who've booked this service */
  service?: number;
  /** clients with an appointment whose forms aren't signed yet */
  formsPending?: boolean;
  sort?: ClientSort;
}

export const searchCustomers = async (
  name?: string,
  page?: number,
  limit?: number,
  filters: ClientFilters = {},
) => {
  const params = new URLSearchParams();
  if (name) params.append("name", name);
  if (page !== null && page !== undefined)
    params.append("page", page.toString());
  if (limit !== null && limit !== undefined)
    params.append("limit", limit.toString());
  if (filters.activity) params.append("activity", filters.activity);
  if (filters.service !== undefined)
    params.append("service", String(filters.service));
  if (filters.formsPending) params.append("formsPending", "true");
  if (filters.sort && filters.sort !== "name") params.append("sort", filters.sort);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  return axiosInstance.get(`/api/customers/my-customers/search${queryString}`);
};

export const updateCustomerPersonalDetails = async (
  customerId: string | number,
  data: {
    name: string;
    primaryPhone?: string;
    email?: string;
  },
) =>
  axiosInstance.patch(
    `/api/customers/my-customers/${customerId}/personal-details`,
    data,
  );

export const getArtistForms = async () =>
  axiosInstance.get("/api/forms/my-forms");

export const createClient = async (data: {
  name: string;
  primaryPhone?: string;
  email?: string;
}) => axiosInstance.post("/api/customers/my-customers/create-customer", data);

export const getMyMetrics = async (days?: number) =>
  axiosInstance.get(`/api/artists/my-metrics${days ? `?days=${days}` : ""}`);

export const DeleteAppointment = async (appointmentId: string) =>
  axiosInstance.delete(`/api/appointments/${appointmentId}`);

export const getCustomerMetrics = async (customerId: string) =>
  axiosInstance.get(`/api/customers/my-customers/${customerId}/metrics`);

export const createReminder = async (data: {
  sendAt: string;
  type: string;
  customerId: string | number;
  note: string;
}) => axiosInstance.post("/api/reminders/new-reminder", data);

export const getAllReminders = async () =>
  axiosInstance.get("/api/reminders/all-reminders");

export const getRemindersByCustomer = async (customerId: string) =>
  axiosInstance.get(`/api/reminders/customer/${customerId}`);

export const updateReminder = async (
  reminderId: string | number,
  data: {
    sendAt?: string;
    type?: string;
    note?: string;
  },
) => axiosInstance.patch(`/api/reminders/${reminderId}`, data);

export const deleteReminder = async (reminderId: string | number) =>
  axiosInstance.delete(`/api/reminders/${reminderId}`);

export const getMyServiceForms = async (services: number[]) => {
  const servicesParam = services.join(",");
  return axiosInstance.get(
    `/api/forms/my-service-forms?services=${servicesParam}`,
  );
};

export const updateMyProfile = async (data: {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}) => axiosInstance.patch("/api/artists/my-profile/update", data);

export const getMyProfile = async () =>
  axiosInstance.get("/api/artists/my-profile");

export const getAppointmentById = async (appointmentId: string) =>
  axiosInstance.get(`/api/appointments/${appointmentId}`);

export const updateMySignature = async (data: { signature_url: string }) =>
  axiosInstance.patch("/api/artists/update-signature", data);

export interface SubscriptionPlan {
  priceId: string;
  /** in dollars, e.g. 19.99 */
  amount: number;
  currency: string;
}

export interface SubscriptionPlans {
  monthly: SubscriptionPlan | null;
  yearly: SubscriptionPlan | null;
}

/** the monthly and yearly web plans, as set up in Stripe */
export const getSubscriptionPlans = async () =>
  axiosInstance.get<SubscriptionPlans>("/api/subscriptions/stripe/plans");

export const validateCoupon = async (couponCode: string) => {
  return axiosInstance.post("/api/subscriptions/stripe/validate-coupon", {
    couponCode,
  });
};

export const createSubscription = async (
  priceId: string,
  paymentMethodId: string,
  couponCode?: string,
) => {
  return axiosInstance.post("/api/subscriptions/stripe/create-subscription", {
    priceId,
    paymentMethodId,
    ...(couponCode ? { couponCode } : {}),
  });
};

export const cancelSubscription = async () => {
  return axiosInstance.get("/api/subscriptions/stripe/cancel-subscription");
};

export const getSubscription = async () => {
  return axiosInstance.get("/api/subscriptions/stripe/subscription-details");
};

export const changeSubscriptionPlan = async (
  newPriceId: string,
  paymentMethodId: string,
  couponCode?: string,
) => {
  return axiosInstance.post(
    "/api/subscriptions/stripe/change-subscription-plan",
    {
      newPriceId,
      paymentMethodId,
      ...(couponCode ? { couponCode } : {}),
    },
  );
};

export const listPaymentMethods = async () => {
  return axiosInstance.get("/api/subscriptions/stripe/list-payment-methods");
};

export const addPaymentMethod = async (paymentMethodId: string) => {
  return axiosInstance.post("/api/subscriptions/stripe/add-payment-method", {
    paymentMethodId,
  });
};

export const detachPaymentMethod = async (paymentMethodId: string) => {
  return axiosInstance.post("/api/subscriptions/stripe/detach-payment-method", {
    paymentMethodId,
  });
};

export const listTransactions = async () => {
  return axiosInstance.get("/api/subscriptions/stripe/list-transactions");
};
export const updateBusinessInfo = async (data: {
  businessName: string;
  businessPhoneNumber: string;
  businessAddress: string;
  website?: string;
}) => {
  return axiosInstance.patch("/api/artists/update-business-info", data);
};

export type CareKind = "pre-care" | "aftercare";

export interface CareContent {
  subject: string;
  intro: string;
  sections: { heading: string; items: string[] }[];
  closing: string;
}

export interface CareDraft {
  content: CareContent | null;
  source: "ai" | "template" | "artist" | null;
  hasForm: boolean;
  // the forms the instructions came from
  formTitles: string[];
  // AI was asked for but failed, so this is the form as written
  aiFailed: boolean;
  aiAvailable: boolean;
  to: string | null;
}

export interface ClientMessage {
  id: string;
  type: "form-nudge-48h" | "form-nudge-24h" | CareKind | "healing-check-in";
  trigger: "auto" | "manual";
  status:
    | "scheduled"
    | "cancelled"
    | "sending"
    | "sent"
    | "failed"
    | "skipped";
  subject?: string;
  to?: string;
  sentAt?: string;
  // when a scheduled check-in goes out
  sendAt?: string;
  checkIn?: { message: string; requestPhoto: boolean };
  // healing photos the client sent back
  photoUrls?: string[];
  createdAt: string;
}

// what would be emailed; `ai` asks OpenAI to write it from the form
export const previewCareMessage = async (
  appointmentId: string,
  type: CareKind,
  ai?: boolean,
) =>
  axiosInstance.get<CareDraft>(
    `/api/appointments/${appointmentId}/client-messages/preview`,
    { params: { type, ...(ai === undefined ? {} : { ai: ai ? "1" : "0" }) } },
  );

export const sendCareMessage = async (
  appointmentId: string,
  data: { type: CareKind; content?: CareContent },
) =>
  axiosInstance.post<{ message: ClientMessage }>(
    `/api/appointments/${appointmentId}/client-messages`,
    data,
  );

export const getClientMessages = async (appointmentId: string) =>
  axiosInstance.get<{ messages: ClientMessage[] }>(
    `/api/appointments/${appointmentId}/client-messages`,
  );

export const completeAppointment = async (
  appointmentId: string,
  data: {
    sendAftercare: boolean;
    aftercare?: CareContent;
    // scheduled in the same step
    checkIn?: CheckInDelay & { subject: string; message: string };
  },
) =>
  axiosInstance.post<{
    appointment: { id: string; completedAt: string };
    aftercare: ClientMessage | null;
    aftercareError: string | null;
    checkIn?: ClientMessage | null;
    checkInError?: string | null;
  }>(`/api/appointments/${appointmentId}/complete`, data);

export type DelayUnit = "days" | "weeks" | "months";

// how far ahead a check-in can go, per unit (the API enforces the same)
export const CHECK_IN_DELAY_LIMITS: Record<DelayUnit, number> = {
  days: 90,
  weeks: 26,
  months: 12,
};

export interface CheckInDelay {
  amount: number;
  unit: DelayUnit;
  requestPhoto: boolean;
}

export interface CheckInDraft {
  subject: string;
  message: string;
  source: "ai" | "template";
  aiAvailable: boolean;
  aiFailed: boolean;
  to: string | null;
  sendAt: string;
}

// a message for the check-in; `useAi: false` gives the standard one
export const draftCheckIn = async (
  appointmentId: string,
  data: CheckInDelay & { useAi?: boolean },
) =>
  axiosInstance.post<CheckInDraft>(
    `/api/appointments/${appointmentId}/healing-check-ins/draft`,
    data,
  );

export const scheduleCheckIn = async (
  appointmentId: string,
  data: CheckInDelay & { subject: string; message: string },
) =>
  axiosInstance.post<{ message: ClientMessage }>(
    `/api/appointments/${appointmentId}/healing-check-ins`,
    data,
  );

export const cancelScheduledMessage = async (
  appointmentId: string,
  messageId: string,
) =>
  axiosInstance.delete<{ message: ClientMessage }>(
    `/api/appointments/${appointmentId}/client-messages/${messageId}`,
  );
