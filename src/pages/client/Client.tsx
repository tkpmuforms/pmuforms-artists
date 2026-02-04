import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddClientModal from "../../components/clientsComp/AddClientModal";
import ClientCard from "../../components/clientsComp/ClientCard";
import ClientSearchModal from "../../components/clientsComp/ClientSearchModal";
import { LoadingSmall } from "../../components/loading/Loading";
import { Client, CustomerResponse } from "../../redux/types";
import { searchCustomers } from "../../services/artistServices";
import { generateColor, generateInitials } from "../../utils/utils";
import "./clients-page.scss";

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClients, setTotalClients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const convertToClient = (
    customer: CustomerResponse["customers"][0],
  ): Client => {
    const clientName = customer?.name ?? customer?.info?.client_name ?? "";
    return {
      id: customer?.id,
      name: clientName || "No name provided",
      email: customer?.email || "No email provided",
      initials: generateInitials(clientName),
      color: generateColor(clientName),
    };
  };

  const fetchCustomers = async (page: number = 1, searchName?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await searchCustomers(searchName, page, itemsPerPage);
      const data: CustomerResponse = response?.data;

      const convertedClients = data.customers?.map(convertToClient);
      setClients(convertedClients);
      setTotalClients(data.metadata.total);
      setTotalPages(Math.ceil(data.metadata.total / itemsPerPage));
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchCustomers(1, searchQuery || undefined);
  }, [itemsPerPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      if (searchQuery.trim()) {
        fetchCustomers(1, searchQuery.trim());
      } else {
        fetchCustomers(1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchFocus = () => {
    setShowSearch(true);
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleAddClientSuccess = () => {
    setShowAddClient(false);
    fetchCustomers(currentPage);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
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
        {/* {searchQuery && (
          <span>
            {" "}
            • Showing {clients.length} results for "{searchQuery}"
          </span>
        )} */}
      </div>

      {error && (
        <div className="clients-page__error">
          <p>{error}</p>
          <button
            onClick={() =>
              fetchCustomers(currentPage, searchQuery || undefined)
            }
          >
            Retry
          </button>
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
          <LoadingSmall />
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="clients-page__pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn pagination-btn--prev"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="pagination-info">
            <span className="pagination-current">{currentPage}</span>
            <span className="pagination-separator">/</span>
            <span className="pagination-total">{totalPages}</span>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn pagination-btn--next"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
          <div className="pagination-per-page">
            <label htmlFor="items-per-page">Show:</label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="per-page-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
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
