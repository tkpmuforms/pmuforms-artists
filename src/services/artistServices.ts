import axiosInstance from "../utils/axios/axiosSetup";

export const createArtist = async (accessToken: string) =>
  axiosInstance.post("/api/auth/artist/create", { accessToken });

export const updateServices = async (data: { services: number[] }) =>
  axiosInstance.put("/api/services/update-services", data);

export const getServices = async () => axiosInstance.get("/api/services");

export const getServiceById = async (serviceId: number | string) =>
  axiosInstance.get(`/api/services/${serviceId}`);

export const getAuthMe = async () => axiosInstance.get("/api/auth/me");

export const sendEmailVerification = async (uid: string) =>
  axiosInstance.get(`/api/auth/send-email-verification/${uid}`);

export const getAppointmentsForCustomer = async (customerId: number | string) =>
  axiosInstance.get(`/api/api/appointments/artist/one-customer/${customerId}`);

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
    `/filled-forms/appointment/${appointmentId}/form/${formTemplateId}`
  );

export const getRootFormTemplates = async () =>
  axiosInstance.get("/forms/root-templates");

export const getFormsByAppointment = async (appointmentId: string | number) =>
  axiosInstance.get(`/forms/appointment/${appointmentId}`);

export const createFormNewVersion = async (data: {
  formTemplateId: string;
  title: string;
  sections: Record<string, unknown>[];
}) => axiosInstance.post("/forms/new-version", data);

export const getFormById = async (formTemplateId: string | number) =>
  axiosInstance.get(`/forms/${formTemplateId}`);

export const updateFormServices = async (
  formTemplateId: string | number,
  data: { services: number[] }
) => axiosInstance.put(`/forms/${formTemplateId}/update-services`, data);

export const updateFormSections = async (
  formTemplateId: string | number,
  data: { sections: Record<string, unknown>[] }
) => axiosInstance.patch(`/forms/${formTemplateId}/update-sections`, data);

export const getMyForms = async () => axiosInstance.get("/forms/my-forms");

export const deleteForm = async (formTemplateId: string | number) =>
  axiosInstance.delete(`/forms/${formTemplateId}/delete`);

export const updateFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  dataId: string | number,
  data: Record<string, unknown>
) =>
  axiosInstance.patch(
    `/forms/${formTemplateId}/sections/${sectionId}/data/${dataId}/update`,
    data
  );

export const deleteFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  dataId: string | number
) =>
  axiosInstance.delete(
    `/forms/${formTemplateId}/sections/${sectionId}/data/${dataId}`
  );

export const addFormSectionData = async (
  formTemplateId: string | number,
  sectionId: string | number,
  data: Record<string, unknown>
) => axiosInstance.post(`/forms/${formTemplateId}/sections/${sectionId}`, data);

export const updateArtistFcmToken = async (data: { fcmToken: string }) =>
  axiosInstance.patch("/artists/update-fcm-token", data);

export const getArtistById = async (artistId: string | number) =>
  axiosInstance.get(`/artists/${artistId}`);

export const getArtistUrl = async (artistId: string | number) =>
  axiosInstance.get(`/artists/${artistId}/url`);

export const deleteMe = async () => axiosInstance.delete("/artists/delete-me");

export const signAppointment = async (
  appointmentId: string | number,
  data: { signatureUrl: string }
) => axiosInstance.post(`/appointments/${appointmentId}/sign`, data);
