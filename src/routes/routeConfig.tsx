import { lazy, ReactNode } from "react";
import Auth from "../pages/auth/Auth.tsx";

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Client = lazy(() => import("../pages/client/Client"));
const Forms = lazy(() => import("../pages/forms/forms"));
const Profile = lazy(() => import("../pages/profile/Profile"));
const ClientDetails = lazy(
  () => import("../pages/client/details/ClientDetails")
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
    path: "/forms",
    element: <Forms />,
    breadcrumbs: ["Forms"],
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
