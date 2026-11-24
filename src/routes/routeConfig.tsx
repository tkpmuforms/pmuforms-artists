import { lazy, ReactNode } from "react";
import Auth from "../pages/auth/Auth.tsx";

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Client = lazy(() => import("../pages/client/Client"));
const Forms = lazy(() => import("../pages/forms/forms"));
const Profile = lazy(() => import("../pages/profile/Profile"));
const ClientDetails = lazy(
  () => import("../pages/client/clients-details/ClientDetails.tsx")
);
const PreviewForms = lazy(
  () => import("../pages/forms/previewForms/PreviewForms.tsx")
);
const EditForms = lazy(() => import("../pages/forms/editForms/EditForms.tsx"));
const NewFormPage = lazy(() => import("../pages/forms/newForm/NewFormPage.tsx"));
const ClientsAppointment = lazy(
  () => import("../pages/client/client-appointments/ClientsAppointment.tsx")
);
const ClientsFormsForAppointments = lazy(
  () =>
    import(
      "../pages/client/clients-appointment-forms/ClientsFormsForAppointments.tsx"
    )
);
const ClientNotesPage = lazy(
  () => import("../pages/client/clients-note/ClientNotes.tsx")
);
const FIlledFormsPreviewPage = lazy(
  () =>
    import(
      "../pages/client/clients-appointments-filledforms-preview/FIlledFormsPreview.tsx"
    )
);
const SignaturePage = lazy(
  () => import("../pages/client/client-appointment-signature/SignaturePage.tsx")
);
const ReminderPage = lazy(
  () => import("../pages/client/client-reminders/ClientReminders.tsx")
);
const ReferPage = lazy(() => import("../pages/refer/ReferPage.tsx"));
const IntegrationsPage = lazy(
  () => import("../pages/profile/IntegrationsPage.tsx")
);
const SquareServicesMappingPage = lazy(
  () => import("../pages/profile/SquareServicesMappingPage.tsx")
);

const InventoryPage = lazy(() => import("../pages/inventory/InventoryPage.tsx"));
const ProductFormPage = lazy(
  () => import("../pages/inventory/ProductFormPage.tsx")
);
const ProductDetailPage = lazy(
  () => import("../pages/inventory/ProductDetailPage.tsx")
);
const ReceiveStockPage = lazy(
  () => import("../pages/inventory/ReceiveStockPage.tsx")
);
const BatchDetailPage = lazy(
  () => import("../pages/inventory/BatchDetailPage.tsx")
);
const InventorySettingsPage = lazy(
  () => import("../pages/inventory/InventorySettingsPage.tsx")
);

const AllAppointments = lazy(
  () => import("../pages/appointments/Appointment.tsx")
);

const EditProfilePage = lazy(
  () => import("../pages/profile/edit-profile/EditProfilePage.tsx")
);

const BusinessInformationPage = lazy(
  () =>
    import("../pages/profile/business-information/BusinessInformationPage.tsx")
);

const ContactUsPage = lazy(
  () => import("../pages/contact-support/contactUs.tsx")
);

const PrivacyPolicyPage = lazy(
  () => import("../pages/privacy-policy/PrivacyPolicy.tsx")
);
const PaymentPage = lazy(
  () => import("../pages/profile/payment-page/PaymentPage.tsx")
);

const ServicesPage = lazy(
  () => import("../pages/services/ServicesPage.tsx")
);
interface RouteProps {
  path: string;
  element: ReactNode;
  breadcrumbs?: string[];
  showAds?: boolean;
}

export const authorizedRoutes: RouteProps[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    breadcrumbs: ["Dashboard"],
  },
  {
    path: "/appointments",
    element: <AllAppointments />,
    breadcrumbs: ["Dashboard", "Appointments"],
  },
  {
    path: "/clients",
    element: <Client />,
    breadcrumbs: ["Clients"],
  },
  {
    path: "/clients/:id",
    element: <ClientDetails />,
    breadcrumbs: ["Clients", "Client Details"],
  },
  {
    path: "/clients/:id/reminders",
    element: <ReminderPage />,
    breadcrumbs: ["Clients", "Client Details", "Reminders"],
  },
  {
    path: "/clients/:id/appointments",
    element: <ClientsAppointment />,
    breadcrumbs: ["Clients", "Client Details", "Appointments"],
  },

  {
    path: "/clients/:id/appointments/:appointmentId/forms",
    element: <ClientsFormsForAppointments />,
    breadcrumbs: ["Clients", "Client Details", "Appointments", "Forms"],
  },
  {
    path: "/clients/:clientId/notes",
    element: <ClientNotesPage />,
    breadcrumbs: ["Clients", "Client Details", "Notes"],
  },
  {
    path: "/clients/:id/appointments/:appointmentId/signature",
    element: <SignaturePage />,
    breadcrumbs: ["Clients", "Client Details", "Appointments", "Signature"],
  },
  {
    // every filled form for the appointment, one PDF for all of them
    path: "/clients/:id/appointments/:appointmentId/forms/all",
    element: <FIlledFormsPreviewPage />,
    breadcrumbs: ["Clients", "Client Details", "Appointments", "Forms", "All Forms"],
  },
  {
    path: "/clients/:id/appointments/:appointmentId/forms/:templateId",
    element: <FIlledFormsPreviewPage />,
    breadcrumbs: [
      "Clients",
      "Client Details",
      "Appointments",
      "Forms",
      "Filled Form Preview",
    ],
  },
  {
    path: "/forms",
    element: <Forms />,
    breadcrumbs: ["Forms"],
  },
  {
    path: "/services",
    element: <ServicesPage />,
    breadcrumbs: ["Services"],
  },
  {
    path: "/forms/preview/:formId",
    element: <PreviewForms />,
    breadcrumbs: ["Forms", "Preview Form"],
  },
  {
    path: "/forms/new",
    element: <NewFormPage />,
    breadcrumbs: ["Forms", "New Form"],
  },
  {
    path: "/forms/edit/:formId",
    element: <EditForms />,
    breadcrumbs: ["Forms", "Edit Form"],
  },
  {
    path: "/profile",
    element: <Profile />,
    breadcrumbs: ["Profile"],
  },
  {
    path: "/profile/edit",
    element: <EditProfilePage />,
    breadcrumbs: ["Profile", "Edit Profile"],
  },
  {
    path: "/profile/business-information",
    element: <BusinessInformationPage />,
    breadcrumbs: ["Profile", "Business Information"],
  },
  {
    path: "/inventory",
    element: <InventoryPage />,
    breadcrumbs: ["Inventory"],
  },
  {
    path: "/inventory/products/new",
    element: <ProductFormPage />,
    breadcrumbs: ["Inventory", "New Product"],
  },
  {
    path: "/inventory/products/:productId",
    element: <ProductDetailPage />,
    breadcrumbs: ["Inventory", "Product"],
  },
  {
    path: "/inventory/products/:productId/edit",
    element: <ProductFormPage />,
    breadcrumbs: ["Inventory", "Product", "Edit"],
  },
  {
    path: "/inventory/receive",
    element: <ReceiveStockPage />,
    breadcrumbs: ["Inventory", "Receive Stock"],
  },
  {
    path: "/inventory/batches/:batchId",
    element: <BatchDetailPage />,
    breadcrumbs: ["Inventory", "Batch"],
  },
  {
    path: "/inventory/settings",
    element: <InventorySettingsPage />,
    breadcrumbs: ["Inventory", "Settings"],
  },
  {
    path: "/integrations",
    element: <IntegrationsPage />,
    breadcrumbs: ["Integrations"],
  },
  {
    path: "/integrations/square/mapping",
    element: <SquareServicesMappingPage />,
    breadcrumbs: ["Integrations", "Services Mapping"],
  },
  {
    path: "/refer",
    element: <ReferPage />,
    breadcrumbs: ["Refer & Earn"],
  },
  {
    path: "/profile/payment",
    element: <PaymentPage />,
    breadcrumbs: ["Profile", "Payment"],
  },
  {
    path: "/contact-us",
    element: <ContactUsPage />,
    breadcrumbs: ["Profile", "Contact Us"],
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicyPage />,
    breadcrumbs: ["Profile", "Privacy Policy"],
  },
];

export const nonAuthRoutes: RouteProps[] = [
  {
    path: "/",
    element: <Auth />,
    breadcrumbs: [],
  },
];
