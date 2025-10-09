import { CircularProgress } from "@mui/material";
import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import useAuth from "../context/useAuth";
import NotFound from "../components/not-found/NotFound";
import AuthenticatedLayout from "../components/layout/AuthenticatedLayout";
import { authorizedRoutes, nonAuthRoutes } from "./routeConfig";

interface DisplayElementProps {
  element: React.ReactNode;
  breadcrumbs?: string[];
  showAds?: boolean;
}

const RouteGuard = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </div>
    );
  }

  const displayElement = ({
    element,
    breadcrumbs,
    showAds,
  }: DisplayElementProps) => {
    return (
      <AuthenticatedLayout breadcrumbs={breadcrumbs} showAds={showAds}>
        <Suspense
          fallback={
            <CircularProgress
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          }
        >
          {element}
        </Suspense>
      </AuthenticatedLayout>
    );
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        {nonAuthRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {nonAuthRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {authorizedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={displayElement({
            element: route.element,
            breadcrumbs: route.breadcrumbs,
            showAds: route.showAds,
          })}
        />
      ))}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RouteGuard;
