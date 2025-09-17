"use client";

import { Calendar, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AppointmentCard from "../../components/dashboardComp/AppointmentCard";
import { LoadingSmall } from "../../components/loading/Loading";
import { Appointment as AppointmentType } from "../../redux/types";
import {
  getArtistAppointmentsPaginated,
  getCustomerById,
} from "../../services/artistServices";
import { formatAppointmentTime } from "../../utils/utils";
import "./appointment.scss";

interface AppointmentsResponse {
  metadata: {
    total: number;
    currentPage: number;
    perPage: number;
    lastPage: number;
    firstPage: number;
  };
  appointments: AppointmentType[];
}

const Appointment: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [customers, setCustomers] = useState<
    Record<string, { name: string; avatar?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [filteredAppointments, setFilteredAppointments] = useState<
    AppointmentType[]
  >([]);

  const perPage = 10;

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      let allAppointments: AppointmentType[] = [];
      let currentPageData = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await getArtistAppointmentsPaginated(
          currentPageData,
          perPage
        );
        const data: AppointmentsResponse = response.data;

        if (data && data.appointments) {
          allAppointments = [...allAppointments, ...data.appointments];
          hasMorePages = currentPageData < data.metadata.lastPage;
          currentPageData++;
        } else {
          hasMorePages = false;
        }
      }

      setAppointments(allAppointments);
      setTotalAppointments(allAppointments.length);
      await fetchCustomersData(allAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersData = async (appointmentsList: AppointmentType[]) => {
    const uniqueCustomerIds = [
      ...new Set(appointmentsList.map((apt) => apt.customerId)),
    ].filter(Boolean) as string[];

    if (uniqueCustomerIds.length === 0) return;

    try {
      const customerPromises = uniqueCustomerIds.map((customerId) =>
        getCustomerById(customerId).catch((error) => {
          console.error(`Error fetching customer ${customerId}:`, error);
          return null;
        })
      );

      const customerResponses = await Promise.all(customerPromises);
      const customerMap = customerResponses.reduce((acc, response, index) => {
        if (response && response.data) {
          const customerId = uniqueCustomerIds[index];
          const customer = response.data?.customer;
          acc[customerId] = {
            name: customer.info?.client_name || "Unknown Client",
            avatar: customer.info?.avatar_url,
          };
        }
        return acc;
      }, {} as Record<string, { name: string; avatar?: string }>);

      setCustomers((prev) => ({ ...prev, ...customerMap }));
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  useEffect(() => {
    const filtered = appointments.filter((appointment) => {
      const customerName = customers[appointment.customerId]?.name || "";
      const searchLower = searchTerm.toLowerCase();

      return (
        customerName.toLowerCase().includes(searchLower) ||
        appointment._id.toLowerCase().includes(searchLower) ||
        formatAppointmentTime(appointment.date)
          .toLowerCase()
          .includes(searchLower)
      );
    });

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [appointments, customers, searchTerm]);

  const getTotalPages = () => Math.ceil(filteredAppointments.length / perPage);

  const getCurrentPageAppointments = () => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredAppointments.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    const totalPages = getTotalPages();
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getCustomerName = (customerId: string) =>
    customers[customerId]?.name || `Client 1`;

  const getCustomerAvatar = (customerId: string) => {
    const customer = customers[customerId];
    if (customer?.avatar) return customer.avatar;

    const customerName = customer?.name || "Unknown Client";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      customerName
    )}&background=A858F0&color=fff&size=40`;
  };

  const renderPagination = () => {
    const totalPages = getTotalPages();
    if (totalPages <= 1) return null;

    return (
      <div className="pagination-controls">
        <div
          className="pagination-arrow"
          onClick={() => handlePageChange(currentPage - 1)}
          style={{
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            color: currentPage === 1 ? "#ddd" : "#000",
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </div>
        <span className="pagination-text">
          Page {currentPage} of {totalPages}
        </span>
        <div
          className="pagination-arrow"
          onClick={() => handlePageChange(currentPage + 1)}
          style={{
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            color: currentPage === totalPages ? "#ddd" : "#000",
            opacity: currentPage === totalPages ? 0.5 : 1,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </div>
      </div>
    );
  };

  const renderAppointments = () => {
    const currentPageAppointments = getCurrentPageAppointments();
    if (currentPageAppointments.length === 0)
      return <div>No appointments found</div>;

    return currentPageAppointments.map((appointment) => (
      <AppointmentCard
        key={appointment.id}
        name={
          appointment?.customerId
            ? getCustomerName(appointment.customerId)
            : "Unknown Client"
        }
        avatar={getCustomerAvatar(appointment.customerId)}
        time={formatAppointmentTime(appointment.date)}
        service={
          appointment.serviceDetails[0]?.service || "Service not specified"
        }
        onClickViewFullSchedule={() =>
          navigate(`/clients/${appointment.customerId}/appointments`)
        }
      />
    ));
  };

  if (loading) {
    return (
      <div className="appointments">
        <div className="appointments__header">
          <h1>All Appointments</h1>
        </div>
        <div className="appointments__loading">
          <LoadingSmall />
        </div>
      </div>
    );
  }

  return (
    <div className="appointments">
      <div className="appointments__header">
        <div className="appointments__title-section">
          <h1>All Appointments</h1>
          <p>
            {searchTerm
              ? `Showing ${filteredAppointments.length} of ${totalAppointments} appointments`
              : `Total: ${totalAppointments} appointments`}
          </p>
        </div>

        <div className="appointments__actions">
          <div className="appointments__search">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by client name, appointment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="appointments__content">
        {filteredAppointments.length === 0 ? (
          <div className="appointments__empty">
            <Calendar size={48} />
            <h3>No appointments found</h3>
            <p>
              {searchTerm
                ? "Try adjusting your search terms"
                : "You haven't scheduled any appointments yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="appointments__grid">{renderAppointments()}</div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default Appointment;
