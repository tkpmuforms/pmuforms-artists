"use client";

import type React from "react";
import { type ReactNode, useEffect, useState } from "react";
import "./authenticatedLayout.scss";
import Sidebar from "./sidebar/Sidebar";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  breadcrumb?: ReactNode;
  showAds?: boolean;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  breadcrumb,
  showAds,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleSidebarToggle = () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("sidebar--collapsed"));
      }
    };

    // Check initial state
    handleSidebarToggle();

    // Listen for changes
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
        {breadcrumb && (
          <div className="authenticated-layout__breadcrumb">{breadcrumb}</div>
        )}
        <main className="authenticated-layout__main">{children}</main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
