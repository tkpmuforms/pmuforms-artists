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
  const [metadata, setMetadata] = useState({
    total: 0,
    lastPage: 1,
  });

  const perPage = 10;

  const fetchPageAppointments = async (page: number) => {
    try {
      setLoading(true);
      const response = await getArtistAppointmentsPaginated(page, perPage);
      const data: AppointmentsResponse = response.data;

      if (data && data.appointments) {
        setAppointments(data.appointments);
        setMetadata({
          total: data.metadata.total,
          lastPage: data.metadata.lastPage,
        });
        await fetchCustomersData(data.appointments);
      }
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
    fetchPageAppointments(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= metadata.lastPage) {
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
    if (metadata.lastPage <= 1) return null;

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
          Page {currentPage} of {metadata.lastPage}
        </span>
        <div
          className="pagination-arrow"
          onClick={() => handlePageChange(currentPage + 1)}
          style={{
            cursor:
              currentPage === metadata.lastPage ? "not-allowed" : "pointer",
            color: currentPage === metadata.lastPage ? "#ddd" : "#000",
            opacity: currentPage === metadata.lastPage ? 0.5 : 1,
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
    if (appointments.length === 0) return <div>No appointments found</div>;

    return appointments.map((appointment) => (
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
          <p>Total: {metadata.total} appointments</p>
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
        {appointments.length === 0 ? (
          <div className="appointments__empty">
            <Calendar size={48} />
            <h3>No appointments found</h3>
            <p>You haven't scheduled any appointments yet</p>
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
