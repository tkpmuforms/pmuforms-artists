import { Boxes } from "lucide-react";
import type React from "react";
import { useState } from "react";
import useAuth from "../../context/useAuth";
import SubscriptionModal from "../dashboardComp/SubScriptionModal";

/** Inventory is part of the paid plan; everyone else sees what it offers. */
const InventoryGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isMember } = useAuth();
  const [showPlans, setShowPlans] = useState(false);
  const subscribed = !!(user?.appStorePurchaseActive || user?.stripeSubscriptionActive);

  if (subscribed) return <>{children}</>;

  return (
    <div className="inv-page">
      <div className="inv-card inv-gate">
        <Boxes size={40} className="inv-gate__icon" />
        <h2>Inventory &amp; product traceability</h2>
        <p>
          Track every product and lot you use, see what's expiring, keep each
          product's documentation in one place, and know exactly which clients
          received a batch if it's ever recalled.
        </p>
        <p className="inv-muted">
          Inventory is included with a PMU Forms subscription.
          {/* billing is the owner's */}
          {isMember && " Ask the account owner to subscribe."}
        </p>
        {!isMember && (
          <button className="inv-btn inv-btn--primary" onClick={() => setShowPlans(true)}>
            See plans
          </button>
        )}
      </div>
      {showPlans && <SubscriptionModal onClose={() => setShowPlans(false)} />}
    </div>
  );
};

export default InventoryGate;
