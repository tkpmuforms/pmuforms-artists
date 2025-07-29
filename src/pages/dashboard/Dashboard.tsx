"use client";

import type React from "react";
import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";

import "./dashboard.scss";
import MetricsCard from "../../components/dashboardComp/MetricsCard";
import QuickActionCard from "../../components/dashboardComp/QuickActionCard";
import AppointmentCard from "../../components/dashboardComp/AppointmentCard";
import SubscriptionModal from "../../components/dashboardComp/SubScriptionModal";
import FeaturesModal from "../../components/dashboardComp/FeaturesModal.";
import PricingModal from "../../components/dashboardComp/PricingModal";

const Dashboard: React.FC = () => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const metricsData = [
    {
      title: "Total Clients",
      value: "32",
      icon: "👥",
      color: "#a855f7",
    },
    {
      title: "Forms Shared",
      value: "12",
      icon: "📋",
      color: "#10b981",
    },
    {
      title: "Pending Submissions",
      value: "04",
      icon: "📝",
      color: "#f59e0b",
    },
    {
      title: "Today's Schedule",
      value: "07",
      icon: "📅",
      color: "#ef4444",
    },
  ];

  const quickActions = [
    {
      title: "Add New Client",
      icon: "👤",
      color: "#a855f7",
      onClick: () => console.log("Add client"),
    },
    {
      title: "Create Form",
      icon: "📋",
      color: "#f59e0b",
      onClick: () => console.log("Create form"),
    },
    {
      title: "Send Form",
      icon: "📤",
      color: "#10b981",
      onClick: () => console.log("Send form"),
    },
  ];

  const appointments = [
    {
      name: "Evelyn Carter",
      avatar: "/api/placeholder/40/40",
      time: "9:00 AM",
    },
    {
      name: "Ava Montgomery",
      avatar: "/api/placeholder/40/40",
      time: "11:00 AM",
    },
    {
      name: "Sophie Bennett",
      avatar: "/api/placeholder/40/40",
      time: "2:00 PM",
    },
    {
      name: "Maya Sinclair",
      avatar: "/api/placeholder/40/40",
      time: "4:00 PM",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="dashboard__welcome">
          <h1>Hey, Linda 👋</h1>
          <p>Here's your activity for today</p>
        </div>
        <div className="dashboard__actions">
          <button
            className="dashboard__add-client-btn"
            onClick={() => setShowSubscriptionModal(true)}
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
              <QuickActionCard key={index} {...action} />
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
            {appointments.map((appointment, index) => (
              <AppointmentCard key={index} {...appointment} />
            ))}
          </div>
        </section>
      </div>

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onShowFeatures={() => {
            setShowSubscriptionModal(false);
            setShowFeaturesModal(true);
          }}
          onShowPricing={() => {
            setShowSubscriptionModal(false);
            setShowPricingModal(true);
          }}
        />
      )}

      {showFeaturesModal && (
        <FeaturesModal
          onClose={() => setShowFeaturesModal(false)}
          onSubscribe={() => {
            setShowFeaturesModal(false);
            setShowPricingModal(true);
          }}
        />
      )}

      {showPricingModal && (
        <PricingModal
          onClose={() => setShowPricingModal(false)}
          onSubscribe={() => setShowPricingModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
