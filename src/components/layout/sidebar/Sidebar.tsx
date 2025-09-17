"use client";

import type React from "react";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Menu, type MenuItem } from "../menu";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./sidebar.scss";
import {
  ClientIcon,
  DashboardIcon,
  FormsIcon,
  ProfileIcon,
} from "../../../assets/svgs/DashboardSvg.tsx";
import useAuth from "../../../context/useAuth.ts";
import { Avatar } from "@mui/material";
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, logout } = useAuth();
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
      const activeMenuItem = Menu.find(
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
        forms: FormsIcon,
        profile: ProfileIcon,
      };
      const IconComponent = iconMap[iconName];
      return IconComponent ? (
        <IconComponent isActive={isActive} />
      ) : (
        <span>•</span>
      );
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
                <div className="sidebar__avatar">
                  <Avatar
                    src={user?.info?.avatar_url ?? ""}
                    alt={user?.businessName ?? ""}
                    sx={{ width: 40, height: 40 }}
                  />
                </div>
              )}
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
              {Menu.map((item) => {
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
