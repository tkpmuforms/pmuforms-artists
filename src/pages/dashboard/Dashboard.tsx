"use client";

import { ChevronDown, Plus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import AppointmentCard from "../../components/dashboardComp/AppointmentCard";
import FeaturesModal from "../../components/dashboardComp/FeaturesModal.";
import MetricsCard from "../../components/dashboardComp/MetricsCard";
import PricingModal from "../../components/dashboardComp/PricingModal";
import QuickActionCard from "../../components/dashboardComp/QuickActionCard";
import SubscriptionModal from "../../components/dashboardComp/SubScriptionModal";
import useAuth from "../../context/useAuth";
import { appointments, metricsData, quickActions } from "../../jsons/TestData";
import { getArtistAppointments } from "../../services/artistServices";
import "./dashboard.scss";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  useEffect(() => {
    getArtistAppointments()
      .then((response) => {
        console.log("Fetched appointments:", response.data);
        // Handle appointments data
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
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
