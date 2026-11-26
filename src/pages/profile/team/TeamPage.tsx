import { CircularProgress } from "@mui/material";
import { Mail, RotateCw, UserMinus, UserPlus, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import useAuth from "../../../context/useAuth";
import {
  getTeam,
  inviteTeamMember,
  removeTeamMember,
  resendTeamInvite,
  teamErrorText,
  type TeamMember,
} from "../../../services/teamServices";
import { forgetTeamPeople } from "../../../utils/teamPeople";
import "../../../components/profile/edit-business-information-modal.scss";
import "./team-page.scss";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const day = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

const nameOf = (m: TeamMember) =>
  [m.firstName, m.lastName].filter(Boolean).join(" ");

/** What the row says under the person's name. */
const detail = (m: TeamMember) => {
  if (m.status === "invited") {
    return m.inviteExpired
      ? `Invite expired (sent ${day(m.invitedAt)})`
      : `Invited ${day(m.invitedAt)}`;
  }
  const parts = [`Joined ${day(m.joinedAt)}`];
  if (m.lastActiveAt) parts.push(`last active ${day(m.lastActiveAt)}`);
  return parts.join(", ");
};

/**
 * Settings > Team: the owner invites people to work in their account. Team
 * members see clients, appointments, forms and inventory, but not Settings,
 * billing or integrations; what they do is saved under their name.
 */
const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [seatLimit, setSeatLimit] = useState(5);
  const [loadError, setLoadError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [inviting, setInviting] = useState(false);
  // the row whose button is working
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);

  const load = () => {
    setLoadError("");
    getTeam()
      .then(({ data }) => {
        setMembers(data.members ?? []);
        if (data.seatLimit) setSeatLimit(data.seatLimit);
      })
      .catch((e) => setLoadError(teamErrorText(e, "Couldn't load your team.")));
  };

  useEffect(load, []);

  const upsert = (member: TeamMember) =>
    setMembers((prev) => {
      const list = prev ?? [];
      return list.some((m) => m.id === member.id)
        ? list.map((m) => (m.id === member.id ? member : m))
        : [...list, member];
    });

  const seatsUsed = members?.length ?? 0;
  const full = seatsUsed >= seatLimit;

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL.test(clean)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (user?.email && user.email.toLowerCase() === clean) {
      setEmailError("That's your own email.");
      return;
    }
    setInviting(true);
    try {
      const { data } = await inviteTeamMember(clean);
      upsert(data.member);
      setEmail("");
      toast.success(`Invite sent to ${data.member.email}`);
    } catch (error) {
      setEmailError(teamErrorText(error, "Couldn't send the invite. Please try again."));
    } finally {
      setInviting(false);
    }
  };

  const resend = async (m: TeamMember) => {
    // the invite box's error was about another email
    setEmailError("");
    setBusyId(m.id);
    try {
      const { data } = await resendTeamInvite(m.id);
      upsert(data.member);
      toast.success(`Invite sent again to ${m.email}`);
    } catch (error) {
      toast.error(teamErrorText(error, "Couldn't resend the invite. Please try again."));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (m: TeamMember) => {
    setConfirmRemove(null);
    setEmailError("");
    setBusyId(m.id);
    try {
      await removeTeamMember(m.id);
      setMembers((prev) => (prev ?? []).filter((x) => x.id !== m.id));
      forgetTeamPeople();
      toast.success(
        m.status === "invited"
          ? `Invite to ${m.email} cancelled`
          : `${nameOf(m) || m.email} was removed from your team`,
      );
    } catch (error) {
      toast.error(teamErrorText(error, "Couldn't do that. Please try again."));
    } finally {
      setBusyId(null);
    }
  };

  // the API asks for the owner's details before the first invite
  const needsOwnerDetails = /owner's details/i.test(emailError);

  return (
    <div className="team-page">
      <div className="team-page__container">
        <header className="team-page__header">
          <h1>Team</h1>
          <p>
            Invite the artists who work with you. They sign in with their own
            email and work in this account: clients, appointments, consent
            forms, notes and inventory, with what they do saved under their
            name. Settings, billing and integrations stay yours.
          </p>
        </header>

        <section className="team-page__section" aria-label="Invite someone">
          <h2>Invite someone</h2>
          <form className="team-page__invite" onSubmit={invite} noValidate>
            <input
              type="email"
              className="form-input"
              placeholder="their@email.com"
              aria-label="Email to invite"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              aria-invalid={!!emailError}
              disabled={inviting || full}
              autoComplete="off"
            />
            <button
              type="submit"
              className="team-page__button"
              disabled={inviting || full || !email.trim()}
            >
              <UserPlus size={16} />
              {inviting ? "Sending..." : "Send invite"}
            </button>
          </form>
          {emailError && (
            <p className="team-page__error" role="alert">
              {emailError}{" "}
              {needsOwnerDetails && (
                <Link to="/profile/business-information">Add them now</Link>
              )}
            </p>
          )}
          <p className="team-page__muted">
            {full
              ? `Your team is full (${seatLimit} people). Remove someone to invite another.`
              : `${seatsUsed} of ${seatLimit} seats used. Invites work for 7 days.`}
          </p>
        </section>

        <section className="team-page__section" aria-label="Your team">
          <h2>Your team</h2>
          {loadError ? (
            <p className="team-page__error" role="alert">
              {loadError}{" "}
              <button type="button" className="team-page__link" onClick={load}>
                Try again
              </button>
            </p>
          ) : !members ? (
            <div className="team-page__loading">
              <CircularProgress size={28} />
            </div>
          ) : members.length === 0 ? (
            <p className="team-page__muted">
              No one yet. People you invite show up here.
            </p>
          ) : (
            <ul className="team-page__list">
              {members.map((m) => {
                const name = nameOf(m);
                const busy = busyId === m.id;
                return (
                  <li key={m.id} className="team-page__row">
                    <div className="team-page__person">
                      <div className="team-page__name">
                        {name || m.email}
                        <span
                          className={`team-page__badge team-page__badge--${
                            m.status === "active"
                              ? "active"
                              : m.inviteExpired
                                ? "expired"
                                : "invited"
                          }`}
                        >
                          {m.status === "active"
                            ? "Active"
                            : m.inviteExpired
                              ? "Expired"
                              : "Invited"}
                        </span>
                      </div>
                      {name && <div className="team-page__email">{m.email}</div>}
                      <div className="team-page__detail">{detail(m)}</div>
                    </div>
                    <div className="team-page__actions">
                      {m.status === "invited" && (
                        <button
                          type="button"
                          className="team-page__button team-page__button--outline"
                          onClick={() => resend(m)}
                          disabled={busy}
                        >
                          {m.inviteExpired ? <Mail size={14} /> : <RotateCw size={14} />}
                          {m.inviteExpired ? "Send new invite" : "Resend"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="team-page__button team-page__button--danger"
                        onClick={() => setConfirmRemove(m)}
                        disabled={busy}
                      >
                        {m.status === "invited" ? <X size={14} /> : <UserMinus size={14} />}
                        {m.status === "invited" ? "Cancel invite" : "Remove"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {confirmRemove && (
        <div className="edit-business-information-modal">
          <div
            className="edit-business-information-modal__overlay"
            onClick={() => setConfirmRemove(null)}
          />
          <div
            className="edit-business-information-modal__content"
            role="dialog"
            aria-label="Confirm"
          >
            <button
              className="edit-business-information-modal__close"
              onClick={() => setConfirmRemove(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            {confirmRemove.status === "invited" ? (
              <>
                <h2>Cancel this invite?</h2>
                <p className="team-page__dialog-text">
                  The link sent to {confirmRemove.email} will stop working.
                </p>
              </>
            ) : (
              <>
                <h2>Remove {nameOf(confirmRemove) || confirmRemove.email}?</h2>
                <p className="team-page__dialog-text">
                  They're signed out straight away and can't open this account
                  again. Their name stays on the notes and appointments they
                  added.
                </p>
              </>
            )}
            <div className="team-page__dialog-actions">
              <button
                type="button"
                className="team-page__button team-page__button--outline"
                onClick={() => setConfirmRemove(null)}
              >
                Keep
              </button>
              <button
                type="button"
                className="team-page__button team-page__button--danger-solid"
                onClick={() => remove(confirmRemove)}
              >
                {confirmRemove.status === "invited" ? "Cancel invite" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
