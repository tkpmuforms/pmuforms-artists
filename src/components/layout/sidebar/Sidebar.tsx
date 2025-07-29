"use client";

import type React from "react";
import { useState } from "react";
import { Menu, type MenuItem } from "../menu";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./sidebar.scss";

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (item: MenuItem) => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeItem = "Dashboard",
  onItemClick,
  className = "",
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleItemClick = (item: MenuItem) => {
    onItemClick?.(item);
    // Close mobile menu after selection
    setIsMobileOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const renderIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      dashboard: "📊",
      clients: "👥",
      forms: "📋",
      profile: "👤",
    };
    return iconMap[iconName] || "•";
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="sidebar__mobile-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="sidebar__overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isMobileOpen ? "sidebar--open" : ""} ${
          isCollapsed ? "sidebar--collapsed" : ""
        } ${className}`}
        data-collapsed={isCollapsed}
      >
        {/* Collapse Toggle Button */}
        <button
          className="sidebar__collapse-toggle"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User Profile Section */}
        <div className="sidebar__header">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              <img
                src="/api/placeholder/40/40"
                alt="Glow Beauty Avatar"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNBODU4RjAiLz4KPHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkc8L3RleHQ+Cjwvc3ZnPg==";
                }}
              />
            </div>
            {!isCollapsed && (
              <div className="sidebar__user-info">
                <h3 className="sidebar__user-name">Glow Beauty</h3>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar__nav">
          <ul className="sidebar__menu">
            {Menu.map((item) => (
              <li key={item.TSKey} className="sidebar__menu-item">
                <button
                  className={`sidebar__menu-link ${
                    activeItem === item.TSKey
                      ? "sidebar__menu-link--active"
                      : ""
                  }`}
                  onClick={() => handleItemClick(item)}
                  aria-current={activeItem === item.TSKey ? "page" : undefined}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className="sidebar__menu-icon">
                    {item.icon && renderIcon(item.icon)}
                  </span>
                  {!isCollapsed && (
                    <span className="sidebar__menu-text">{item.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
