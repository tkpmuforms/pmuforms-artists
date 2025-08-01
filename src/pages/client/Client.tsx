"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import "./clients-page.scss";
import ClientCard from "../../components/clientsComp/ClientCard";
import ClientSearchModal from "../../components/clientsComp/ClientSearchModal";
import AddClientModal from "../../components/clientsComp/AddClientModal";

import { Client, CustomerResponse } from "../../redux/types";
import { searchCustomers } from "../../services/artistServices";
import { LoadingSmall } from "../../components/loading/Loading";
import { useNavigate } from "react-router-dom";
import { generateColor, generateInitials } from "../../utils/utils";

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClients, setTotalClients] = useState(0);

  const convertToClient = (
    customer: CustomerResponse["customers"][0]
  ): Client => {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email || "No email provided",
      initials: generateInitials(customer.name),
      color: generateColor(customer.name),
    };
  };

  const fetchCustomers = async (searchName?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchCustomers(searchName, 1, 30);
      const data: CustomerResponse = response.data;

      const convertedClients = data.customers.map(convertToClient);
      setClients(convertedClients);
      setTotalClients(data.metadata.total);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchCustomers(searchQuery.trim());
      } else {
        fetchCustomers();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchFocus = () => {
    setShowSearch(true);
  };

  const handleClientClick = (clientId: string) => {
    // Navigate to client detail page
    navigate(`/clients/${clientId}`);
  };

  const handleAddClientSuccess = () => {
    setShowAddClient(false);
    fetchCustomers();
  };

  if (loading && clients.length === 0) {
    return <LoadingSmall />;
  }

  return (
    <div className="clients-page">
      <div className="clients-page__header">
        <div className="clients-page__title-section">
          <h1>Your Clients</h1>
          <p>Clients who fill out your forms will appear here</p>
        </div>
        <button
          className="clients-page__add-btn"
          onClick={() => setShowAddClient(true)}
        >
          <Plus size={16} />
          Add a New Client
        </button>
      </div>

      <div className="clients-page__search">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="search name, email, phone number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            className="search-input"
          />
        </div>
      </div>

      <div className="clients-page__stats">
        <span>Total Clients: {totalClients}</span>
        {searchQuery && (
          <span>
            {" "}
            • Showing {clients.length} results for "{searchQuery}"
          </span>
        )}
      </div>

      {error && (
        <div className="clients-page__error">
          <p>{error}</p>
          <button onClick={() => fetchCustomers()}>Retry</button>
        </div>
      )}

      {clients.length === 0 && !loading ? (
        <div className="clients-page__empty">
          <p>
            {searchQuery
              ? `No clients found matching "${searchQuery}"`
              : "No clients found. Add your first client to get started!"}
          </p>
        </div>
      ) : (
        <div className="clients-page__grid">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => handleClientClick(client.id)}
            />
          ))}
        </div>
      )}

      {loading && clients.length > 0 && (
        <div className="clients-page__loading-more">
          <p>Updating results...</p>
        </div>
      )}

      {showSearch && <ClientSearchModal onClose={() => setShowSearch(false)} />}

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={handleAddClientSuccess}
        />
      )}
    </div>
  );
};

export default ClientsPage;
