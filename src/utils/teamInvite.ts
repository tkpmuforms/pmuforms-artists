/**
 * A team invite someone opened (/join/:token), remembered for this tab while
 * they sign up or log in. Kept in sessionStorage because logging out clears
 * localStorage, and someone signed in elsewhere logs out to accept.
 */
export interface SavedTeamInvite {
  /** lower case, as the API stores it */
  email: string;
  businessName: string;
}

const KEY = "pmu_team_invite";

export const saveTeamInvite = (invite: SavedTeamInvite) => {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        email: invite.email.trim().toLowerCase(),
        businessName: invite.businessName,
      }),
    );
  } catch {
    // private mode: the invite still works, there's just no reminder
  }
};

export const savedTeamInvite = (): SavedTeamInvite | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedTeamInvite>;
    if (typeof parsed?.email !== "string" || !parsed.email) return null;
    return { email: parsed.email, businessName: parsed.businessName ?? "" };
  } catch {
    return null;
  }
};

export const forgetTeamInvite = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to forget
  }
};

/**
 * Signing in with another email while an invite is open would make a new
 * business instead of joining the team: the message to show, or null if fine.
 */
export const teamInviteMismatch = (signedInEmail?: string | null) => {
  const invite = savedTeamInvite();
  if (!invite) return null;
  if ((signedInEmail ?? "").trim().toLowerCase() === invite.email) return null;
  const team = invite.businessName ? ` ${invite.businessName}'s team` : " the team";
  return `This invite is for ${invite.email}. Sign in with that email to join${team}, or dismiss the invite to use another account.`;
};
