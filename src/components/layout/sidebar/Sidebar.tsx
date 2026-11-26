"use client";

import type React from "react";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Menu, type MenuItem } from "../menu";
import { Check, ChevronLeft, ChevronRight, Copy, Mail } from "lucide-react";
import { SUPPORT_EMAIL, copySupportEmail } from "../../../utils/support";
import "./sidebar.scss";
import {
  ClientIcon,
  DashboardIcon,
  FormsIcon,
  SettingsIcon,
  ServicesIcon,
} from "../../../assets/svgs/DashboardSvg.tsx";
import { IntegrationsIcon } from "../../../assets/svgs/IntegrationsSvg.tsx";
import { InventoryIcon } from "../../../assets/svgs/InventorySvg.tsx";
import { ReferIcon } from "../../../assets/svgs/ReferSvg.tsx";
import { AppointmentsIcon } from "../../../assets/svgs/AppointmentsSvg.tsx";
import useAuth from "../../../context/useAuth.ts";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (item: MenuItem) => void;
  className?: string;
}

export interface SidebarRef {
  toggleMobileMenu: () => void;
}

const Sidebar = forwardRef<SidebarRef, SidebarProps>(
  ({ activeItem, onItemClick, className = "" }, ref) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [emailCopied, setEmailCopied] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, logout, isMember } = useAuth();
    const menu = isMember ? Menu.filter((item) => !item.ownerOnly) : Menu;
    const navigate = useNavigate();
    const location = useLocation();

    useImperativeHandle(ref, () => ({
      toggleMobileMenu: () => {
        setIsMobileOpen(!isMobileOpen);
      },
    }));

    const getCurrentActiveItem = () => {
      if (activeItem) return activeItem;

      const currentPath = location.pathname;
      const activeMenuItem = menu.find(
        (item) =>
          currentPath === item.basePath ||
          currentPath.startsWith(item.basePath + "/")
      );

      return activeMenuItem?.TSKey || "Dashboard";
    };

    const currentActiveItem = getCurrentActiveItem();

    const handleItemClick = (item: MenuItem) => {
      onItemClick?.(item);
      navigate(item?.basePath);
      setIsMobileOpen(false);
    };

    const toggleCollapse = () => {
      setIsCollapsed(!isCollapsed);
    };

    const renderIcon = (iconName: string, isActive: boolean = false) => {
      const iconMap: { [key: string]: React.FC<{ isActive?: boolean }> } = {
        dashboard: DashboardIcon,
        clients: ClientIcon,
        appointments: AppointmentsIcon,
        forms: FormsIcon,
        services: ServicesIcon,
        inventory: InventoryIcon,
        integrations: IntegrationsIcon,
        refer: ReferIcon,
        settings: SettingsIcon,
      };
      const IconComponent = iconMap[iconName];
      return IconComponent ? (
        <IconComponent isActive={isActive} />
      ) : (
        <span>•</span>
      );
    };

    const openContact = () => {
      navigate("/contact-us");
      setIsMobileOpen(false);
    };

    const copyEmail = async () => {
      if (await copySupportEmail()) {
        setEmailCopied(true);
        window.setTimeout(() => setEmailCopied(false), 2000);
      }
    };

    return (
      <>
        {isMobileOpen && (
          <div
            className="sidebar__overlay"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <aside
          className={`sidebar ${isMobileOpen ? "sidebar--open" : ""} ${
            isCollapsed ? "sidebar--collapsed" : ""
          } ${className}`}
          data-collapsed={isCollapsed}
        >
          <button
            className="sidebar__collapse-toggle"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>

          <div className="sidebar__header">
            <div className="sidebar__user">
              {!isCollapsed && (
                <div className="sidebar__user-info">
                  <h3 className="sidebar__user-name">
                    {user?.businessName || ""}
                  </h3>
                </div>
              )}
            </div>
          </div>

          <nav className="sidebar__nav">
            <ul className="sidebar__menu">
              {menu.map((item) => {
                const isActive = currentActiveItem === item.TSKey;
                return (
                  <li key={item.TSKey} className="sidebar__menu-item">
                    <button
                      className={`sidebar__menu-link ${
                        isActive ? "sidebar__menu-link--active" : ""
                      }`}
                      onClick={() => handleItemClick(item)}
                      aria-current={isActive ? "page" : undefined}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <span className="sidebar__menu-icon">
                        {item.icon && renderIcon(item.icon, isActive)}
                      </span>
                      {!isCollapsed && (
                        <span className="sidebar__menu-text">{item.name}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="sidebar__footer">
            {/* stays in the app: the contact page, and an email to copy
                (a mailto link opened Outlook in place of the app) */}
            <div className="sidebar__support">
              <button
                type="button"
                className="sidebar__support-icon"
                onClick={openContact}
                title="Contact support"
                aria-label="Need help? Contact support"
              >
                <Mail size={18} />
              </button>
              {!isCollapsed && (
                <>
                  <span className="sidebar__support-text">
                    <button
                      type="button"
                      className="sidebar__support-label"
                      onClick={openContact}
                    >
                      Need help?
                    </button>
                    {/* the copy button sits on the email's own line */}
                    <span className="sidebar__support-email-row">
                      <span className="sidebar__support-email">
                        {SUPPORT_EMAIL}
                      </span>
                      <button
                        type="button"
                        className="sidebar__support-copy"
                        onClick={copyEmail}
                        title={emailCopied ? "Copied" : "Copy email"}
                        aria-label={
                          emailCopied
                            ? "Support email copied"
                            : "Copy support email"
                        }
                      >
                        {emailCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </span>
                  </span>
                </>
              )}
            </div>
            <button
              className="sidebar__logout-button"
              onClick={logout}
              title="Logout"
            >
              <span className="sidebar__logout-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 19H4C2.9 19 2 18.1 2 17V7C2 5.9 2.9 5 4 5H10M14 19L22 12M22 12L14 5M22 12H10"
                    stroke="#292D32"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {!isCollapsed && (
                <span className="sidebar__logout-text">Logout</span>
              )}
            </button>
          </div>
        </aside>
      </>
    );
  }
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
