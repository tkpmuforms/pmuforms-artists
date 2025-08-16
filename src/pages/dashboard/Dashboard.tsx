"use client";

import { ChevronDown, Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreateNewClientIcon,
  CreateNewFormIcon,
  FormsSavedIcon,
  PendingSubmissionsIcon,
  PeopleIcon,
  SendFormIcon,
  TodaysScheduleIcon,
} from "../../assets/svgs/DashboardSvg";
import AddClientModal from "../../components/clientsComp/AddClientModal";
import AppointmentCard from "../../components/dashboardComp/AppointmentCard";
import FeaturesModal from "../../components/dashboardComp/FeaturesModal.";
import FormLinkModal from "../../components/dashboardComp/FormLinkModal";
import MetricsCard from "../../components/dashboardComp/MetricsCard";
import QuickActionCard from "../../components/dashboardComp/QuickActionCard";
import SubscriptionModal from "../../components/dashboardComp/SubScriptionModal";
import { LoadingSmall } from "../../components/loading/Loading";
import useAuth from "../../context/useAuth";
import { Appointment } from "../../redux/types";
import {
  getArtistAppointments,
  getMyMetrics,
  searchCustomers,
} from "../../services/artistServices";
import { formatAppointmentTime } from "../../utils/utils";
import "./dashboard.scss";

interface Metrics {
  totalClients: number;
  formsShared: number;
  pendingSubmissions: number;
  todaysSchedule: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  console.log("User in Dashboard:", user);
  const navigate = useNavigate();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showFormLinkModal, setShowFormLinkModal] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
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
    Promise.all([
      getArtistAppointments(),
      searchCustomers(undefined, 1, 30),
      getMyMetrics(),
    ])
      .then(([appointmentsResponse, customersResponse, metricsResponse]) => {
        console.log("Fetched appointments:", appointmentsResponse.data);
        console.log("Fetched customers:", customersResponse.data);
        console.log("Fetched metrics:", metricsResponse.data);

        setAppointments(appointmentsResponse.data?.appointments);
        setMetrics(metricsResponse.data?.metrics);

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

  // Show loading state for entire dashboard
  if (loading) {
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
              <LoadingSmall />
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
              <LoadingSmall />
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Render dashboard content when not loading
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
            {metrics ? (
              [
                {
                  title: "Total Clients",
                  value: metrics.totalClients?.toString() || "0",
                  icon: PeopleIcon,
                  color: "var(--pmu-primary)",
                },
                {
                  title: "Forms Shared",
                  value: metrics.formsShared?.toString() || "0",
                  icon: FormsSavedIcon,
                  color: "#560056",
                },
                {
                  title: "Pending Submissions",
                  value: metrics.pendingSubmissions?.toString() || "0",
                  icon: PendingSubmissionsIcon,
                  color: "#f59e0b",
                },
                {
                  title: "Today's Schedule",
                  value: metrics.todaysSchedule?.toString() || "0",
                  icon: TodaysScheduleIcon,
                  color: "#ef4444",
                },
              ].map((metric, index) => <MetricsCard key={index} {...metric} />)
            ) : (
              <div>No metrics available</div>
            )}
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
            {appointments.length > 0 ? (
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
