import React, { useState } from "react";
import "./AuthenticatedNavbar.scss";
import useAuth from "../../../context/useAuth";
import { Avatar } from "@mui/material";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface AuthenticatedNavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
}

const AuthenticatedNavbar: React.FC<AuthenticatedNavbarProps> = ({
  breadcrumbs = [{ label: "Dashboard" }],
  onSearch,
  onNotificationClick,
  onAvatarClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <nav className="authenticated-navbar">
      <div className="navbar-container">
        {/* Breadcrumbs Section */}
        <div className="navbar-breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="breadcrumb-item">
              {crumb.path ? (
                <a href={crumb.path} className="breadcrumb-link">
                  {crumb.label}
                </a>
              ) : (
                <span className="breadcrumb-text">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="breadcrumb-separator">/</span>
              )}
            </div>
          ))}
        </div>

        {/* Search Section */}
        <div className="navbar-search">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-container">
              <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M17.5 17.5l-5.5-5.5m0 0a7 7 0 1 0-9.899-9.899A7 7 0 0 0 12 12z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search name, email, phone number..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          </form>
        </div>

        {/* User Actions Section */}
        <div className="navbar-actions">
          {/* Notifications */}
          <button
            className="notification-button"
            onClick={onNotificationClick}
            aria-label="Notifications"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {user?.notifications > 0 && (
              <span className="notification-badge">{user.notifications}</span>
            )}
          </button>

          {/* User Avatar */}
          <button
            className="avatar-button"
            onClick={onAvatarClick}
            aria-label="User menu"
          >
            <div className="avatar-container">
              <Avatar
                src={user?.info?.avatar_url ?? ""}
                alt={user?.name ?? user?.info?.client_name ?? ""}
                sx={{ width: 40, height: 40 }}
              />
            </div>
            <span className="user-name">{user.name}</span>
            <svg
              className="dropdown-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AuthenticatedNavbar;
