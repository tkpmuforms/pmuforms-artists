"use client";

import { ChevronDown, Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
import FormCard from "../../components/formsComp/FormCard";
import { LoadingSmall } from "../../components/loading/Loading";
import useAuth from "../../context/useAuth";
import { Appointment } from "../../redux/types";
import {
  getArtistAppointments,
  getArtistForms,
  getCustomerById,
  getMyMetrics,
} from "../../services/artistServices";
import { formatAppointmentTime, transformFormData } from "../../utils/utils";
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
  const [showAddClient, setShowAddClient] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [customers, setCustomers] = useState<
    Record<string, { name: string; avatar?: string }>
  >({});
  const [recentForms, setRecentForms] = useState<any[]>([]);

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
        if (user?.appStorePurchaseActive === false) {
          setShowSubscriptionModal(true);
        } else {
          setShowFormLinkModal(true);
        }
      },
    },
  ];

  const getMetricsConfig = (metricsData?: Metrics | null) => [
    {
      title: "Total Clients",
      value: metricsData?.totalClients?.toString() || "0",
      icon: PeopleIcon,
      color: "var(--pmu-primary)",
    },
    {
      title: "Forms Shared",
      value: metricsData?.formsShared?.toString() || "0",
      icon: FormsSavedIcon,
      color: "#560056",
    },
    {
      title: "Pending Submissions",
      value: metricsData?.pendingSubmissions?.toString() || "0",
      icon: PendingSubmissionsIcon,
      color: "#f59e0b",
    },
    {
      title: "Today's Schedule",
      value: metricsData?.todaysSchedule?.toString() || "0",
      icon: TodaysScheduleIcon,
      color: "#ef4444",
    },
  ];

  const getCustomerName = (customerId: string) =>
    customers[customerId]?.name || `Client ${customerId?.substring(0, 8)}`;

  const getCustomerAvatar = (customerId: string) => {
    const customerAvatar = customers[customerId]?.avatar;
    if (customerAvatar) return customerAvatar;

    const customerName = customers[customerId]?.name || "Client";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      customerName
    )}&background=A858F0&color=fff&size=40`;
  };

  const handleModalFlow = {
    closeSubscription: () => setShowSubscriptionModal(false),
    showFeatures: () => {
      setShowSubscriptionModal(false);
      setShowFeaturesModal(true);
    },
    showSubscription: () => {
      setShowFeaturesModal(false);
      setShowSubscriptionModal(true);
    },
    closeFeatures: () => setShowFeaturesModal(false),
    closeFormLink: () => setShowFormLinkModal(false),
    closeAddClient: () => setShowAddClient(false),
  };

  useEffect(() => {
    const fetchAppointmentsAndCustomers = async () => {
      try {
        const appointmentsResponse = await getArtistAppointments();
        const appointments = appointmentsResponse.data?.appointments || [];
        setAppointments(appointments);

        const displayedAppointments = appointments.slice(0, 4);
        const uniqueCustomerIds = [
          ...new Set(
            displayedAppointments.map((apt: any) => apt.customerId as string)
          ),
        ] as string[];

        if (uniqueCustomerIds.length > 0) {
          const customerPromises = uniqueCustomerIds.map((customerId) =>
            getCustomerById(customerId).catch((error) => {
              console.error(`Error fetching customer ${customerId}:`, error);
              return null;
            })
          );

          const customerResponses = await Promise.all(customerPromises);
          const customerMap = customerResponses.reduce(
            (acc, response, index) => {
              if (response && response.data) {
                const customerId = uniqueCustomerIds[index];
                const customer = response.data?.customer;
                acc[customerId] = {
                  name: customer.info?.client_name,
                  avatar: customer.info?.avatar_url,
                };
              }
              return acc;
            },
            {} as Record<string, { name: string; avatar?: string }>
          );

          setCustomers(customerMap);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointments and customers:", error);
        setLoading(false);
      }
    };

    getMyMetrics()
      .then((metricsResponse) => {
        setMetrics(metricsResponse.data?.metrics);
        setMetricsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching metrics:", error);
        setMetricsLoading(false);
      });

    fetchAppointmentsAndCustomers();
  }, []);

  const handlePreview = (formId: string) => {
    navigate(`/forms/preview/${formId}`);
  };
  const handleEdit = (formId: string) => {
    navigate(`/forms/edit/${formId}`);
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const response = await getArtistForms();
        if (response && response.data && response.data.forms) {
          const transformedForms = response.data.forms.map(transformFormData);
          setRecentForms(transformedForms);
        } else {
          toast.error("No forms data received");
        }
      } catch (err) {
        console.error("Error fetching forms:", err);
        toast.error("Failed to fetch forms. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const renderMetrics = () => {
    const metricsConfig = getMetricsConfig(metricsLoading ? null : metrics);
    return metricsConfig.map((metric, index) => (
      <MetricsCard
        key={index}
        {...metric}
        value={metricsLoading ? "loading" : metric.value}
      />
    ));
  };

  const renderAppointments = () => {
    if (appointments.length === 0) return <div>No appointments found</div>;

    return appointments

      .slice(0, 4)
      .map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          name={getCustomerName(appointment.customerId)}
          avatar={getCustomerAvatar(appointment.customerId)}
          time={formatAppointmentTime(appointment.date)}
          service={
            appointment.serviceDetails[0]?.service || "Service not specified"
          }
        />
      ));
  };
  const renderRecentForms = () => {
    if (recentForms.length === 0) return <div>No recent forms found</div>;
    return recentForms
      .sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 8)
      .map((form) => (
        <FormCard
          key={form.id}
          {...form}
          onPreview={() => handlePreview(form.id)}
          onEdit={() => handleEdit(form.id)}
        />
      ));
  };

  const renderHeader = () => (
    <div className="dashboard__header">
      <div className="dashboard__welcome">
        <h1>
          {user?.businessName ? `Hey, ${user.businessName} 👋` : "Hey there 👋"}
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
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="dashboard">
      {renderHeader()}
      <div className="dashboard__content">
        <section className="dashboard__metrics">
          <div className="dashboard__metrics-header">
            <h2 className="dashboard__section-title">KEY METRICS</h2>
            <div className="dashboard__date-filter">
              <button className="dashboard__filter-btn">
                Last 7 days <ChevronDown size={16} />
              </button>
            </div>
          </div>
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
              View all <ChevronDown size={16} />
            </button>
          </div>
          <div className="dashboard__appointments-grid">
            <LoadingSmall />
          </div>
        </section>
      </div>
    </div>
  );

  if (loading) return renderLoadingState();

  return (
    <div className="dashboard">
      {renderHeader()}

      <div className="dashboard__content">
        <section className="dashboard__metrics">
          <div className="dashboard__metrics-header">
            <h2 className="dashboard__section-title">KEY METRICS</h2>
            <div className="dashboard__date-filter">
              <button className="dashboard__filter-btn">
                Last 7 days <ChevronDown size={16} />
              </button>
            </div>
          </div>
          <div className="dashboard__metrics-grid">
            {metrics || metricsLoading ? (
              renderMetrics()
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
              View all <ChevronDown size={16} />
            </button>
          </div>
          <div className="dashboard__appointments-grid">
            {renderAppointments()}
          </div>
        </section>
        <section className="dashboard__recent_forms">
          <div className="dashboard__appointments-header">
            <h2 className="dashboard__section-title">Recent Forms</h2>
            <button className="dashboard__view-all-btn">
              View all <ChevronDown size={16} />
            </button>
          </div>
          <div className="dashboard__appointments-grid">
            {renderRecentForms()}
          </div>
        </section>
      </div>

      {showAddClient && (
        <AddClientModal onClose={handleModalFlow.closeAddClient} />
      )}

      {showFormLinkModal && (
        <FormLinkModal
          onClose={handleModalFlow.closeFormLink}
          businessUri={user?.businessUri || ""}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={handleModalFlow.closeSubscription}
          onShowFeatures={handleModalFlow.showFeatures}
          onSubscribe={handleModalFlow.closeSubscription}
        />
      )}

      {showFeaturesModal && (
        <FeaturesModal
          onClose={handleModalFlow.closeFeatures}
          onSubscribe={handleModalFlow.showSubscription}
        />
      )}
    </div>
  );
};

export default Dashboard;
