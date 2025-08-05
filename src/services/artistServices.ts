import axiosInstance from "../utils/axios/axiosSetup";

export const createArtist = async (accessToken: string) =>
  axiosInstance.post("/api/auth/artist/create", { accessToken });

export const updateServices = async (data: { services: number[] }) =>
  axiosInstance.put("/api/services/update-services", data);

export const getServices = async () => axiosInstance.get("/api/services");

export const getServiceById = async (serviceId: number | string) =>
  axiosInstance.get(`/api/services/${serviceId}`);

export const getAuthMe = async () => axiosInstance.get("/api/auth/me");

export const updateBusinessName = async (data: { businessName: string }) =>
  axiosInstance.patch("/api/artists/update-business-name", data);

export const sendEmailVerification = async (uid: string) =>
  axiosInstance.get(`/api/auth/send-email-verification/${uid}`);

export const getAppointmentsForCustomer = async (customerId: number | string) =>
  axiosInstance.get(`/api/appointments/artist/one-customer/${customerId}`);

export const getArtistAppointments = async () =>
  axiosInstance.get("/api/appointments/artist");

export const bookAppointment = async (data: {
  appointmentDate: string;
  artistId: number | string;
  services: number[];
}) => axiosInstance.post("/api/appointments/book-appointment", data);

export const sendMessage = async (data: {
  email: string;
  firstName: string;
  subject: string;
  message: string;
}) => axiosInstance.post("/api/messages", data);

export const getFilledFormsByAppointment = async (
  appointmentId: string | number
) => axiosInstance.get(`/api/filled-forms/appointment/${appointmentId}`);

export const getFilledFormByAppointmentAndTemplate = async (
  appointmentId: string | number,
  formTemplateId: string | number
) =>
  axiosInstance.get(
    `/api/filled-forms/appointment/${appointmentId}/form/${formTemplateId}`
  );

export const getFormsByAppointment = async (appointmentId: string | number) =>
  axiosInstance.get(`/api/forms/appointment/${appointmentId}`);

export const getFormById = async (formTemplateId: string | number) =>
  axiosInstance.get(`/api/forms/${formTemplateId}`);

export const updateFormServices = async (
  formTemplateId: string | number,
  data: { services: number[] }
) => axiosInstance.put(`/api/forms/${formTemplateId}/update-services`, data);

export const getMyForms = async () => axiosInstance.get("/forms/my-forms");

export const deleteFormTemplate = async (formTemplateId: string | number) =>
  axiosInstance.delete(`/api/forms/${formTemplateId}/delete`);

export const updateFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  dataId: string | number,
  data: Record<string, unknown>
) =>
  axiosInstance.patch(
    `/api/forms/${formTemplateId}/sections/${sectionId}/data/${dataId}/update`,
    data
  );

export const deleteFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  dataId: string | number
) =>
  axiosInstance.delete(
    `/api/forms/${formTemplateId}/sections/${sectionId}/data/${dataId}`
  );

//add and after for the data so the new one is after the old one
export const addFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  data: Record<string, unknown>
) =>
  axiosInstance.post(
    `/api/forms/${formTemplateId}/sections/${sectionId}`,
    data
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
  data: { signatureUrl: string }
) => axiosInstance.post(`/api/appointments/${appointmentId}/sign`, data);

export const getMyCustomers = async (page?: number) => {
  const params = page ? `?page=${page}` : "";
  return axiosInstance.get(`/api/customers/my-customers${params}`);
};

export const getCustomerById = async (customerId: string | number) =>
  axiosInstance.get(`/api/customers/my-customers/${customerId}`);

export const deleteCustomer = async (customerId: string | number) =>
  axiosInstance.delete(`/api/customers/my-customers/${customerId}`);

export const addCustomerNote = async (
  customerId: string | number,
  data: { note: string }
) =>
  axiosInstance.post(`/api/customers/my-customers/${customerId}/notes`, data);

export const getCustomerNotes = async (customerId: string | number) =>
  axiosInstance.get(`/api/customers/my-customers/${customerId}/notes`);

export const updateCustomerNote = async (
  customerId: string | number,
  noteId: string | number,
  data: { note: string }
) =>
  axiosInstance.put(
    `/api/customers/my-customers/${customerId}/notes/${noteId}`,
    data
  );

export const deleteCustomerNote = async (
  customerId: string | number,
  noteId: string | number
) =>
  axiosInstance.delete(
    `/api/customers/my-customers/${customerId}/notes/${noteId}`
  );

export const searchCustomers = async (
  name?: string,
  page?: number,
  limit?: number
) => {
  const params = new URLSearchParams();
  if (name) params.append("name", name);
  if (page !== null && page !== undefined)
    params.append("page", page.toString());
  if (limit !== null && limit !== undefined)
    params.append("limit", limit.toString());

  const queryString = params.toString() ? `?${params.toString()}` : "";
  return axiosInstance.get(`/api/customers/my-customers/search${queryString}`);
};

export const updateCustomerPersonalDetails = async (
  customerId: string | number,
  data: {
    name: string;
    primaryPhone?: string;
    email?: string;
  }
) =>
  axiosInstance.patch(
    `/api/customers/my-customers/${customerId}/personal-details`,
    data
  );

export const getArtistForms = async () =>
  axiosInstance.get("/api/forms/my-forms");

export const createClient = async (data: {
  name: string;
  primaryPhone?: string;
  email?: string;
}) => axiosInstance.post("/api/customers/my-customers/create-customer", data);
