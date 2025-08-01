"use client";

import type React from "react";
import { type ReactNode, useEffect, useState } from "react";
import "./authenticatedLayout.scss";
import Sidebar from "./sidebar/Sidebar";
import AuthenticatedNavbar from "./navbar/AuthenticatedNavbar";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  breadcrumbs?: string[];
  showAds?: boolean;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  breadcrumbs,
  showAds,
  onSearch,
  onNotificationClick,
  onAvatarClick,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSidebarToggle = () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("sidebar--collapsed"));
      }
    };

    handleSidebarToggle();

    const observer = new MutationObserver(handleSidebarToggle);
    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`authenticated-layout ${
        isSidebarCollapsed ? "authenticated-layout--sidebar-collapsed" : ""
      }`}
    >
      <Sidebar />
      <div className="authenticated-layout__content">
        <AuthenticatedNavbar
          breadcrumbs={breadcrumbs}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onAvatarClick={onAvatarClick}
        />
        <main className="authenticated-layout__main">{children}</main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
