"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./client-search-modal.scss";
import { searchCustomers } from "../../services/artistServices";
import { CustomerResponse } from "../../redux/types";
import { generateInitials } from "../../utils/utils";

interface ClientSearchModalProps {
  onClose: () => void;
}

interface RecentSearch {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  initials: string;
}

const ClientSearchModal: React.FC<ClientSearchModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("recentClientSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing recent searches:", error);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const response = await searchCustomers(searchQuery.trim(), 1, 10);
          const data: CustomerResponse = response.data;

          const results = data.customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email || "No email provided",
            initials: generateInitials(customer.name),
          }));

          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const saveToRecentSearches = (client: SearchResult) => {
    const newRecentSearch: RecentSearch = {
      id: client.id,
      name: client.name,
      email: client.email,
      initials: client.initials,
    };

    const filtered = recentSearches.filter((item) => item.id !== client.id);
    const updated = [newRecentSearch, ...filtered].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem("recentClientSearches", JSON.stringify(updated));
  };

  const handleClientClick = (client: SearchResult | RecentSearch) => {
    saveToRecentSearches(client);
    navigate(`/clients/${client.id}`);
    onClose();
  };

  const displayItems = searchQuery.trim() ? searchResults : recentSearches;
  const sectionTitle = searchQuery.trim()
    ? "Search Results"
    : "Recent searches";

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

        <div className="client-search-modal__results">
          <h3>{sectionTitle}</h3>

          {isSearching ? (
            <div className="loading-state">Searching...</div>
          ) : displayItems.length > 0 ? (
            <div className="results-list">
              {displayItems.map((client) => (
                <button
                  key={client.id}
                  className="result-item"
                  onClick={() => handleClientClick(client)}
                >
                  <div className="result-item__avatar">{client.initials}</div>
                  <div className="result-item__info">
                    <div className="result-item__name">{client.name}</div>
                    <div className="result-item__email">{client.email}</div>
                  </div>
                  <ChevronRight size={16} className="result-item__arrow" />
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="no-results">
              No clients found matching "{searchQuery}"
            </div>
          ) : (
            <div className="no-recent">No recent searches</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientSearchModal;
