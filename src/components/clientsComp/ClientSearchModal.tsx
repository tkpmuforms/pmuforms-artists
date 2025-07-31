"use client";

import type React from "react";
import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import "./client-search-modal.scss";

interface ClientSearchModalProps {
  onClose: () => void;
}

const ClientSearchModal: React.FC<ClientSearchModalProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const recentSearches = [
    {
      name: "Linda Lovely",
      email: "linda@fakeemail.com",
      initials: "LL",
    },
    {
      name: "Mark Zuri",
      email: "MarkZuri@gmail.com",
      initials: "MZ",
    },
  ];

  return (
    <div className="client-search-modal">
      <div className="client-search-modal__overlay" onClick={onClose} />
      <div className="client-search-modal__content">
        <div className="client-search-modal__search">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="search name, email, phone number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        <div className="client-search-modal__recent">
          <h3>Recent searches</h3>
          <div className="recent-list">
            {recentSearches.map((client, index) => (
              <button key={index} className="recent-item" onClick={onClose}>
                <div className="recent-item__avatar">{client.initials}</div>
                <div className="recent-item__info">
                  <div className="recent-item__name">{client.name}</div>
                  <div className="recent-item__email">{client.email}</div>
                </div>
                <ChevronRight size={16} className="recent-item__arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSearchModal;
