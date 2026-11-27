import type React from "react";
import { Link } from "react-router-dom";
import useAuth from "../../context/useAuth";
import { monthName } from "../../utils/planLimits";
import { usePlanUsage } from "./usePlanUsage";
import "./plans.scss";

/** warn a little before the limit, like the API's emails */
const WARN_AT = { clients: 8, appointmentsPerMonth: 4 } as const;

interface PlanUsageMeterProps {
  /** change it to load the usage again, e.g. after adding a client */
  refreshKey?: unknown;
  /** off where there's an upgrade button already (Payment) */
  showUpgrade?: boolean;
  className?: string;
}

/**
 * "7 of 10 clients · 3 of 5 appointments in December" for Starter accounts,
 * with a way to upgrade when they're close to a limit. Nothing for Pro.
 */
const PlanUsageMeter: React.FC<PlanUsageMeterProps> = ({
  refreshKey,
  showUpgrade = true,
  className,
}) => {
  const { isMember } = useAuth();
  const data = usePlanUsage(refreshKey);
  if (data?.plan !== "starter" || !data.limits) return null;

  const { limits, usage } = data;
  const clientsFull = usage.clients >= limits.clients;
  const appointmentsFull =
    usage.appointmentsThisMonth >= limits.appointmentsPerMonth;
  const close =
    usage.clients >= Math.min(WARN_AT.clients, limits.clients) ||
    usage.appointmentsThisMonth >=
      Math.min(WARN_AT.appointmentsPerMonth, limits.appointmentsPerMonth);
  const month = monthName(usage.month);

  const full =
    clientsFull && appointmentsFull
      ? `You've reached your client and ${month} appointment limits.`
      : clientsFull
        ? "You've reached your client limit. Delete a client you no longer need to free a space."
        : appointmentsFull
          ? `You've used all your appointments for ${month}.`
          : null;

  return (
    <div
      className={`plan-usage${close ? " plan-usage--close" : ""}${
        className ? ` ${className}` : ""
      }`}
      role="status"
    >
      <span className="plan-usage__plan">Starter</span>
      <span className="plan-usage__counts">
        {usage.clients} of {limits.clients} clients ·{" "}
        {usage.appointmentsThisMonth} of {limits.appointmentsPerMonth}{" "}
        appointments in {month}
      </span>
      {full && <span className="plan-usage__full">{full}</span>}
      {close &&
        showUpgrade &&
        (isMember ? (
          <span className="plan-usage__member">
            Ask the account owner to upgrade to Pro for unlimited clients and
            appointments.
          </span>
        ) : (
          <Link className="plan-usage__upgrade" to="/profile/payment">
            Upgrade to Pro for unlimited
          </Link>
        ))}
    </div>
  );
};

export default PlanUsageMeter;
