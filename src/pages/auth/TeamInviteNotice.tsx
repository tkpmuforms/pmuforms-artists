import type React from "react";
import { useState } from "react";
import { forgetTeamInvite, savedTeamInvite } from "../../utils/teamInvite";

/**
 * On the login and signup pages after opening a team invite: which email to
 * use, so they join the team instead of starting a business of their own.
 */
const TeamInviteNotice: React.FC = () => {
  const [invite, setInvite] = useState(savedTeamInvite);
  if (!invite) return null;
  const team = invite.businessName || "the team";
  return (
    <p className="saved-code-notice team-invite-notice" role="status">
      You're joining <strong>{team}</strong>. Sign up or log in with{" "}
      <strong>{invite.email}</strong>.{" "}
      <button
        type="button"
        className="team-invite-notice__dismiss"
        onClick={() => {
          forgetTeamInvite();
          setInvite(null);
        }}
      >
        Not you?
      </button>
    </p>
  );
};

export default TeamInviteNotice;
