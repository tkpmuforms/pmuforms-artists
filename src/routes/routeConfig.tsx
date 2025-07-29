import { lazy, ReactNode } from "react";
import Auth from "../pages/auth/Auth.tsx";

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));

interface RouteProps {
  path: string;
  element: ReactNode;
  breadcrumbs?: ReactNode[];
  showAds?: boolean;
}

export const authorizedRoutes: RouteProps[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    breadcrumbs: [],
  },
];

export const nonAuthRoutes: RouteProps[] = [
  {
    path: "/",
    element: <Auth />,
    breadcrumbs: [],
  },
];
