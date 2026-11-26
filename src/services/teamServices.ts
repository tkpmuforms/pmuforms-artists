import axiosInstance from "../utils/axios/axiosSetup";
import { getApiErrorMessage } from "../utils/apiError";

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "invited" | "active";
  invitedAt: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  inviteExpired: boolean;
}

export interface TeamPerson {
  id: string;
  name: string;
  role: "owner" | "member";
}

export interface TeamInviteInfo {
  businessName: string;
  ownerName: string;
  email: string;
  expired: boolean;
}

/** The owner's team: people invited or working in the account. */
export const getTeam = () =>
  axiosInstance.get<{ members: TeamMember[]; seatLimit: number }>("/api/team");

export const inviteTeamMember = (email: string) =>
  axiosInstance.post<{ member: TeamMember }>("/api/team/invites", { email });

export const resendTeamInvite = (id: string) =>
  axiosInstance.post<{ member: TeamMember }>(`/api/team/invites/${id}/resend`);

/** Cancels an invite, or takes someone off the team. */
export const removeTeamMember = (id: string) =>
  axiosInstance.delete<{ member: TeamMember }>(`/api/team/members/${id}`);

/** Everyone who has worked in the account, for "Added by" names. */
export const getTeamPeople = () =>
  axiosInstance.get<{ people: TeamPerson[] }>("/api/team/people");

/** A team member's own name. */
export const updateMyTeamName = (data: { firstName: string; lastName: string }) =>
  axiosInstance.patch<{ me: { firstName: string; lastName: string } }>(
    "/api/team/me",
    data,
  );

/** For the join page, before signing in. */
export const getTeamInvite = (token: string) =>
  axiosInstance.get<TeamInviteInfo>(`/api/team/invites/${encodeURIComponent(token)}`);

/**
 * The API's own words, or the fallback. The axios interceptor rejects with
 * the response body ({ message, statusCode }), not the axios error.
 */
export const teamErrorText = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, fallback);
