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
    path: "/forms/preview/:formId",
    element: <PreviewForms />,
    breadcrumbs: ["Forms", "Preview Form"],
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
];

export const nonAuthRoutes: RouteProps[] = [
  {
    path: "/",
    element: <Auth />,
    breadcrumbs: [],
  },
];
