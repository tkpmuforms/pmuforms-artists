"use client";

import type React from "react";
import { useState } from "react";
import { Search, Plus } from "lucide-react";

import "./clients-page.scss";
import ClientCard from "../../components/clientsComp/ClientCard";
import ClientSearchModal from "../../components/clientsComp/ClientSearchModal";
import AddClientModal from "../../components/clientsComp/AddClientModal";

interface Client {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}

const ClientsPage: React.FC = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const clients: Client[] = [
    {
      id: "1",
      name: "Linda Lovely",
      email: "linda@fakeemail.com",
      initials: "LL",
      color: "#e879f9",
    },
    {
      id: "2",
      name: "Mark Zuri",
      email: "MarkZuri@gmail.com",
      initials: "MZ",
      color: "#a855f7",
    },
    {
      id: "3",
      name: "Alice Johnson",
      email: "AliceJohnson@gmail.com",
      initials: "MZ",
      color: "#a855f7",
    },
    {
      id: "4",
      name: "Max Zander",
      email: "MaxZander@email.com",
      initials: "MA",
      color: "#a855f7",
    },
    {
      id: "5",
      name: "Lila Lovelace",
      email: "lila@samplemail.com",
      initials: "LI",
      color: "#a855f7",
    },
  ];

  const handleSearchFocus = () => {
    setShowSearch(true);
  };

  const handleClientClick = (clientId: string) => {
    console.log("Navigate to client:", clientId);
  };

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
        <span>Total Clients: {clients.length}</span>
      </div>

      <div className="clients-page__grid">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onClick={() => handleClientClick(client.id)}
          />
        ))}
      </div>

      {showSearch && <ClientSearchModal onClose={() => setShowSearch(false)} />}

      {showAddClient && (
        <AddClientModal onClose={() => setShowAddClient(false)} />
      )}
    </div>
  );
};

export default ClientsPage;
