"use client";

import { ChevronDown, Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppointmentCard from "../../components/dashboardComp/AppointmentCard";
import FeaturesModal from "../../components/dashboardComp/FeaturesModal.";
import MetricsCard from "../../components/dashboardComp/MetricsCard";
import QuickActionCard from "../../components/dashboardComp/QuickActionCard";
import SubscriptionModal from "../../components/dashboardComp/SubScriptionModal";
import AddClientModal from "../../components/clientsComp/AddClientModal";
import FormLinkModal from "../../components/dashboardComp/FormLinkModal";
import useAuth from "../../context/useAuth";
import { metricsData } from "../../jsons/TestData";
import { Appointment } from "../../redux/types";
import {
  getArtistAppointments,
  searchCustomers,
} from "../../services/artistServices";
import { formatAppointmentTime } from "../../utils/utils";
import "./dashboard.scss";
import { LoadingSmall } from "../../components/loading/Loading";
import {
  CreateNewClientIcon,
  CreateNewFormIcon,
  SendFormIcon,
} from "../../assets/svgs/DashboardSvg";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  console.log("User in Dashboard:", user);
  const navigate = useNavigate();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showFormLinkModal, setShowFormLinkModal] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [customers, setCustomers] = useState<
    Record<string, { name: string; avatar?: string }>
  >({});

  const quickActions = [
    {
      title: "Add New Client",
      icon: CreateNewClientIcon,

      onClick: () => setShowAddClient(true),
    },
    {
      title: "Create Form",
      icon: CreateNewFormIcon,

      onClick: () => navigate("/forms"),
    },
    {
      title: "Send Form",
      icon: SendFormIcon,
      onClick: () => {
        // Check if user is active (subscribed)
        if (user?.isActive === false) {
          setShowSubscriptionModal(true);
        } else {
          setShowFormLinkModal(true);
        }
      },
    },
  ];

  const getCustomerName = (customerId: string) => {
    return (
      customers[customerId]?.name || `Client ${customerId.substring(0, 8)}`
    );
  };

  const getCustomerAvatar = (customerId: string) => {
    const customerAvatar = customers[customerId]?.avatar;
    if (customerAvatar) {
      return customerAvatar;
    }
    const customerName = customers[customerId]?.name || "Client";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      customerName
    )}&background=A858F0&color=fff&size=40`;
  };

  useEffect(() => {
    Promise.all([getArtistAppointments(), searchCustomers(undefined, 1, 30)])
      .then(([appointmentsResponse, customersResponse]) => {
        console.log("Fetched appointments:", appointmentsResponse.data);
        console.log("Fetched customers:", customersResponse.data);

        setAppointments(appointmentsResponse.data.appointments);

        const customerMap = customersResponse.data.customers.reduce(
          (
            acc: Record<string, { name: string; avatar?: string }>,
            customer: {
              id: string;
              name: string;
              info?: { avatar_url?: string };
            }
          ) => {
            acc[customer.id] = {
              name: customer.name,
              avatar: customer.info?.avatar_url,
            };
            return acc;
          },
          {}
        );
        setCustomers(customerMap);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="dashboard__welcome">
          <h1>
            {user?.businessName
              ? `Hey, ${user.businessName} 👋`
              : "Hey there 👋"}
          </h1>
          <p>Here's your activity for today</p>
        </div>
        <div className="dashboard__actions">
          <button
            className="dashboard__add-client-btn"
            onClick={() => setShowAddClient(true)}
          >
            <Plus size={16} />
            Add New Client
          </button>
          <div className="dashboard__date-filter">
            <button className="dashboard__filter-btn">
              Last 7 days
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard__content">
        <section className="dashboard__metrics">
          <h2 className="dashboard__section-title">KEY METRICS</h2>

          <div className="dashboard__metrics-grid">
            {metricsData.map((metric, index) => (
              <MetricsCard key={index} {...metric} />
            ))}
          </div>
        </section>

        <section className="dashboard__quick-actions">
          <h2 className="dashboard__section-title">QUICK ACTIONS</h2>
          <div className="dashboard__actions-grid">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                {...action}
                onClick={action.onClick}
              />
            ))}
          </div>
        </section>

        <section className="dashboard__appointments">
          <div className="dashboard__appointments-header">
            <h2 className="dashboard__section-title">NEXT APPOINTMENT</h2>
            <button className="dashboard__view-all-btn">
              View all
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="dashboard__appointments-grid">
            {loading ? (
              <div>
                <LoadingSmall />
              </div>
            ) : appointments.length > 0 ? (
              appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  name={getCustomerName(appointment.customerId)}
                  avatar={getCustomerAvatar(appointment.customerId)}
                  time={formatAppointmentTime(appointment.date)}
                  service={
                    appointment.serviceDetails[0]?.service ||
                    "Service not specified"
                  }
                />
              ))
            ) : (
              <div>No appointments found</div>
            )}
          </div>
        </section>
      </div>

      {showAddClient && (
        <AddClientModal onClose={() => setShowAddClient(false)} />
      )}

      {showFormLinkModal && (
        <FormLinkModal
          onClose={() => setShowFormLinkModal(false)}
          businessUri={user?.businessUri || ""}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onShowFeatures={() => {
            setShowSubscriptionModal(false);
            setShowFeaturesModal(true);
          }}
          //TODO UPDATE: Pass onSubscribe prop to handle subscription logic
          onSubscribe={() => {
            setShowSubscriptionModal(false);
          }}
        />
      )}

      {showFeaturesModal && (
        <FeaturesModal
          onClose={() => setShowFeaturesModal(false)}
          onSubscribe={() => {
            setShowFeaturesModal(false);
            setShowSubscriptionModal(true);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
