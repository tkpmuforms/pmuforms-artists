import type React from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../context/useAuth";
import type { PlanLimitError } from "../../utils/planLimits";
import "./plans.scss";

interface PlanLimitNoticeProps {
  limit: PlanLimitError;
  /** e.g. close the modal it's in, before going to Payment */
  onUpgrade?: () => void;
}

/**
 * Shown instead of an error when Starter's client or appointment limit
 * stopped something: the API's reason and a way to upgrade. Billing is the
 * owner's, so a team member is told to ask them.
 */
const PlanLimitNotice: React.FC<PlanLimitNoticeProps> = ({ limit, onUpgrade }) => {
  const { isMember } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="plan-limit-notice" role="alert">
      <p className="plan-limit-notice__message">{limit.message}</p>
      {isMember ? (
        <p className="plan-limit-notice__member">
          Ask the account owner to upgrade to Pro.
        </p>
      ) : (
        <button
          type="button"
          className="plan-limit-notice__upgrade"
          onClick={() => {
            onUpgrade?.();
            navigate("/profile/payment");
          }}
        >
          Upgrade to Pro
        </button>
      )}
    </div>
  );
};

export default PlanLimitNotice;
