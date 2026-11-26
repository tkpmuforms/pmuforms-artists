"use client";

import type React from "react";
import { type ReactNode, useEffect, useState, useRef } from "react";
import "./authenticatedLayout.scss";
import Sidebar, { type SidebarRef } from "./sidebar/Sidebar";
import AuthenticatedNavbar from "./navbar/AuthenticatedNavbar";
import SavedOfferPrompt from "../dashboard/SavedOfferPrompt";
import TeamGate from "../team/TeamGate";
import useAuth from "../../context/useAuth";

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
  onSearch,
  onNotificationClick,
  onAvatarClick,
}) => {
  const { isMember } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarRef = useRef<SidebarRef>(null);

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

  const handleMobileMenuToggle = () => {
    sidebarRef.current?.toggleMobileMenu();
  };

  return (
    <div
      className={`authenticated-layout ${
        isSidebarCollapsed ? "authenticated-layout--sidebar-collapsed" : ""
      }`}
    >
      <Sidebar ref={sidebarRef} />
      <div className="authenticated-layout__content">
        <AuthenticatedNavbar
          breadcrumbs={breadcrumbs}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          // onAvatarClick={onAvatarClick}
          onMobileMenuToggle={handleMobileMenuToggle}
        />
        <main className="authenticated-layout__main">
          {/* owner or team member; asks a new member for their name */}
          <TeamGate />
          {/* a discount code from a link or QR code, until it's used; billing
              is the owner's, so never for team members */}
          {!isMember && <SavedOfferPrompt />}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
