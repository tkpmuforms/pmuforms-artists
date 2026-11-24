"use client";

import { ChevronDown, Plus } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
import AppointmentActionsMenu from "../../components/clientsComp/appointments/AppointmentActionsMenu";
import { useAppointmentActions } from "../../components/clientsComp/appointments/useAppointmentActions";
import FeaturesModal from "../../components/dashboardComp/FeaturesModal.";
import FormLinkModal from "../../components/dashboardComp/FormLinkModal";
import MetricsCard from "../../components/dashboardComp/MetricsCard";
import QuickActionCard from "../../components/dashboardComp/QuickActionCard";
import StartNewFormFlow, {
  StartFormIcon,
} from "../../components/dashboardComp/StartNewFormFlow";
import SubscriptionModal from "../../components/dashboardComp/SubScriptionModal";
import FormCard from "../../components/formsComp/FormCard";
import { LoadingSmall } from "../../components/loading/Loading";
import useAuth from "../../context/useAuth";
import { Appointment } from "../../redux/types";
import {
  getArtistAppointmentsPaginated,
  getArtistForms,
  getCustomerById,
  getMyMetrics,
} from "../../services/artistServices";
import { formatAppointmentTime, transformFormData } from "../../utils/utils";
import { servicesOf } from "../../utils/formFilters";
import "./dashboard.scss";

interface Metrics {
  totalClients: number;
  formsShared: number;
  pendingSubmissions: number;
  todaysSchedule: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showFormLinkModal, setShowFormLinkModal] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showStartNewForm, setShowStartNewForm] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [customers, setCustomers] = useState<
    Record<string, { name: string; avatar?: string }>
  >({});
  const [recentForms, setRecentForms] = useState<any[]>([]);

  const [selectedDays, setSelectedDays] = useState(7);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const daysDropdownRef = useRef<HTMLDivElement>(null);

  const dayOptions = [
    { label: "Last 7 days", value: 7 },
    { label: "Last 14 days", value: 14 },
    { label: "Last 30 days", value: 30 },
    { label: "Last 90 days", value: 90 },
  ];

  const selectedLabel =
    dayOptions.find((o) => o.value === selectedDays)?.label ?? "Last 7 days";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        daysDropdownRef.current &&
        !daysDropdownRef.current.contains(e.target as Node)
      ) {
        setShowDaysDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveSubscription =
    user?.appStorePurchaseActive || user?.stripeSubscriptionActive;

  const quickActions = [
    {
      title: "Send Forms Link",
      icon: StartFormIcon,
      onClick: () => {
        if (!hasActiveSubscription) {
          setShowSubscriptionModal(true);
        } else {
          setShowStartNewForm(true);
        }
      },
    },
    {
      title: "Share Bussiness Link",
      icon: SendFormIcon,
      onClick: () => {
        if (!hasActiveSubscription) {
          setShowSubscriptionModal(true);
        } else {
          setShowFormLinkModal(true);
        }
      },
    },
    {
      title: "Add New Client",
      icon: CreateNewClientIcon,
      onClick: () => setShowAddClient(true),
    },
    {
      title: "Manage Forms",
      icon: CreateNewFormIcon,
      onClick: () => navigate("/forms"),
    },
  ];

  const getMetricsConfig = (metricsData?: Metrics | null) => [
    {
      title: "Total Clients",
      value:
        metricsData?.totalClients == null
          ? "loading"
          : metricsData.totalClients.toString(),
      icon: PeopleIcon,
      color: "var(--pmu-primary)",
      onClick: () => navigate("/clients"),
    },
    {
      title: "Forms Shared",
      value:
        metricsData?.formsShared == null
          ? "loading"
          : metricsData.formsShared.toString(),
      icon: FormsSavedIcon,
      color: "#560056",
    },
    {
      title: "Pending Submissions",
      value:
        metricsData?.pendingSubmissions == null
          ? "loading"
          : metricsData.pendingSubmissions.toString(),
      icon: PendingSubmissionsIcon,
      color: "#f59e0b",
    },
    {
      title: "Today's Schedule",
      value:
        metricsData?.todaysSchedule == null
          ? "loading"
          : metricsData.todaysSchedule.toString(),
      icon: TodaysScheduleIcon,
      color: "#ef4444",
    },
  ];

  const getCustomerName = (customerId: string) =>
    customers[customerId]?.name || `Client 1`;

  // the same ⋯ menu as the appointments page
  const { handlersFor, modals: appointmentModals } = useAppointmentActions({
    onDeleted: (appointmentId) =>
      setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId)),
    onCompleted: (appointmentId, completedAt) =>
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, completedAt } : apt,
        ),
      ),
  });

  const getCustomerAvatar = (customerId: string) => {
    const customerAvatar = customers[customerId]?.avatar;
    if (customerAvatar) return customerAvatar;

    const customerName = customers[customerId]?.name || "Unknown Client";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      customerName,
    )}&background=A858F0&color=fff&size=40`;
  };

  const refreshMetrics = async (days?: number) => {
    try {
      setMetricsLoading(true);
      const metricsResponse = await getMyMetrics(days ?? selectedDays);
      setMetrics(metricsResponse.data?.metrics);
    } catch (error) {
      console.error("Error refreshing metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleDaysChange = (days: number) => {
    setSelectedDays(days);
    setShowDaysDropdown(false);
    refreshMetrics(days);
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
    closeAddClientAndRefresh: async () => {
      setShowAddClient(false);
      await refreshMetrics();
    },
  };

  useEffect(() => {
    const fetchAppointmentsAndCustomers = async () => {
      try {
        const appointmentsResponse = await getArtistAppointmentsPaginated();
        const appointments = appointmentsResponse.data?.appointments || [];
        setAppointments(appointments);

        const displayedAppointments = appointments.slice(0, 4);
        const uniqueCustomerIds = [
          ...new Set(
            displayedAppointments.map((apt: any) => apt.customerId as string),
          ),
        ] as string[];

        if (uniqueCustomerIds.length > 0) {
          const customerPromises = uniqueCustomerIds.map((customerId) =>
            getCustomerById(customerId).catch((error) => {
              console.error(`Error fetching customer ${customerId}:`, error);
              return null;
            }),
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
            {} as Record<string, { name: string; avatar?: string }>,
          );

          setCustomers(customerMap);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointments and customers:", error);
        setLoading(false);
      }
    };

    getMyMetrics(selectedDays)
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
      .map((appointment) => {
        const name = appointment?.customerId
          ? getCustomerName(appointment.customerId)
          : "Unknown Client";
        const openForms = () =>
          navigate(
            `/clients/${appointment.customerId}/appointments/${appointment.id}/forms`,
            {
              // a real name saves the forms page a lookup
              state: { clientName: customers[appointment.customerId]?.name },
            },
          );
        return (
          <AppointmentCard
            key={appointment.id}
            name={name}
            avatar={getCustomerAvatar(appointment.customerId)}
            time={formatAppointmentTime(appointment.date)}
            services={(appointment.serviceDetails ?? []).map((s) => s.service)}
            onViewForms={openForms}
            actions={
              <AppointmentActionsMenu
                signed={appointment.signed}
                completedAt={appointment.completedAt}
                label={`${name}'s appointment`}
                onViewForms={openForms}
                {...handlersFor({
                  appointmentId: appointment.id,
                  clientName: customers[appointment.customerId]?.name || name,
                  services: appointment.serviceDetails,
                })}
              />
            }
          />
        );
      });
  };
  const renderRecentForms = () => {
    if (recentForms.length === 0) return <div>No recent forms found</div>;
    return recentForms
      .sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 8)
      .map((form) => (
        <FormCard
          key={form.id}
          {...form}
          serviceNames={servicesOf(form, user?.services).map((s) => s.service)}
          onPreview={() => handlePreview(form.id)}
          onEdit={() => handleEdit(form.id)}
        />
      ));
  };

  // Prefer the artist's own first name (Edit Your Profile), then the business
  // name; skip the "New Business" placeholder new accounts start with.
  const greetingName =
    user?.profile?.firstName?.trim() ||
    (user?.businessName && user.businessName !== "New Business"
      ? user.businessName
      : "");

  const renderHeader = () => (
    <div className="dashboard__header">
      <div className="dashboard__welcome">
        <h1>{greetingName ? `Hey, ${greetingName} 👋` : "Hey there 👋"}</h1>
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
            <div className="dashboard__date-filter" ref={daysDropdownRef}>
              <button
                className="dashboard__filter-btn"
                onClick={() => setShowDaysDropdown((v) => !v)}
              >
                {selectedLabel} <ChevronDown size={16} />
              </button>
              {showDaysDropdown && (
                <div className="dashboard__filter-dropdown">
                  {dayOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`dashboard__filter-option${selectedDays === opt.value ? " dashboard__filter-option--active" : ""}`}
                      onClick={() => handleDaysChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
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
            <h2 className="dashboard__section-title">RECENT APPOINTMENTS</h2>
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

        <section className="dashboard__metrics">
          <div className="dashboard__metrics-header">
            <h2 className="dashboard__section-title">KEY METRICS</h2>
            <div className="dashboard__date-filter" ref={daysDropdownRef}>
              <button
                className="dashboard__filter-btn"
                onClick={() => setShowDaysDropdown((v) => !v)}
              >
                {selectedLabel} <ChevronDown size={16} />
              </button>
              {showDaysDropdown && (
                <div className="dashboard__filter-dropdown">
                  {dayOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`dashboard__filter-option${selectedDays === opt.value ? " dashboard__filter-option--active" : ""}`}
                      onClick={() => handleDaysChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
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

        <section className="dashboard__appointments">
          <div className="dashboard__appointments-header">
            <h2 className="dashboard__section-title">RECENT APPOINTMENTS</h2>
            <button
              className="dashboard__view-all-btn"
              onClick={() => navigate("/appointments")}
            >
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

        {/* <AppointmentGraphs appointments={appointments} /> */}
      </div>

      {showAddClient && (
        <AddClientModal
          onClose={handleModalFlow.closeAddClient}
          onSuccess={handleModalFlow.closeAddClientAndRefresh}
        />
      )}

      {showStartNewForm && (
        <StartNewFormFlow
          onClose={() => setShowStartNewForm(false)}
          onAppointmentCreated={refreshMetrics}
        />
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
      {appointmentModals}
    </div>
  );
};

export default Dashboard;
