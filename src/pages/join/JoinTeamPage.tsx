import { CircularProgress } from "@mui/material";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/layout/navbar/Navbar";
import useAuth from "../../context/useAuth";
import type { Me } from "../../redux/types";
import { getAuthMe } from "../../services/artistServices";
import {
  getTeamInvite,
  teamErrorText,
  type TeamInviteInfo,
} from "../../services/teamServices";
import { forgetTeamInvite, saveTeamInvite } from "../../utils/teamInvite";
import "./join-team.scss";

/**
 * The link in a team invite email. Says whose team it is and which email to
 * use, then sends them to sign up or log in with it. The invite is claimed
 * by signing in with that email, not by this page.
 */
const JoinTeamPage: React.FC = () => {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, me: knownMe, user, logout } = useAuth();
  const [invite, setInvite] = useState<TeamInviteInfo | null>(null);
  const [error, setError] = useState("");
  const [me, setMe] = useState<Me | null>(knownMe);

  useEffect(() => {
    let live = true;
    getTeamInvite(token)
      .then(({ data }) => {
        if (!live) return;
        setInvite(data);
        if (!data.expired) saveTeamInvite(data);
      })
      .catch((e) => {
        if (live) {
          setError(teamErrorText(e, "We couldn't open this invite. Please try again."));
        }
      });
    return () => {
      live = false;
    };
  }, [token]);

  // signed in already: as whom?
  useEffect(() => {
    if (!isAuthenticated || me) return;
    let live = true;
    getAuthMe()
      .then(({ data }) => live && setMe(data?.me ?? null))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [isAuthenticated, me]);

  const team = invite?.businessName || "the team";
  const inviter = invite?.ownerName || invite?.businessName || "The owner";
  const alreadyJoined =
    isAuthenticated &&
    me?.role === "member" &&
    !!invite &&
    me.email.toLowerCase() === invite.email.toLowerCase();

  const body = () => {
    if (error) {
      return (
        <>
          <h1>Invite not found</h1>
          <p>{error}</p>
        </>
      );
    }
    if (!invite) {
      return <CircularProgress size={36} />;
    }
    if (alreadyJoined) {
      return (
        <>
          <h1>You're on {team}'s team</h1>
          <p>You're signed in as {invite.email}.</p>
          <button
            className="join-team__primary"
            onClick={() => {
              forgetTeamInvite();
              navigate("/dashboard");
            }}
          >
            Go to dashboard
          </button>
        </>
      );
    }
    if (invite.expired) {
      return (
        <>
          <h1>This invite has expired</h1>
          <p>
            Invites work for 7 days, and only once. Ask {inviter} to send you a
            new one from their Team settings.
          </p>
        </>
      );
    }
    if (isAuthenticated) {
      // signed in to their own business, or someone else's team
      return (
        <>
          <h1>Join {team}</h1>
          <p>
            You're signed in to <strong>{user?.businessName || "another account"}</strong>.
            To join {team}, log out and sign in with{" "}
            <strong>{invite.email}</strong>.
          </p>
          <button className="join-team__primary" onClick={() => logout()}>
            Log out and continue
          </button>
          <button
            className="join-team__secondary"
            onClick={() => {
              forgetTeamInvite();
              navigate("/dashboard");
            }}
          >
            Stay signed in
          </button>
        </>
      );
    }
    return (
      <>
        <p className="join-team__eyebrow">You're invited</p>
        <h1>Join {team} on PMU Forms</h1>
        <p>
          {inviter} added you to their team. You'll work in the same account
          (clients, appointments, consent forms, notes and inventory), with
          everything you do saved under your name.
        </p>
        <p>
          Use <strong>{invite.email}</strong>, the address this invite was sent
          to.
        </p>
        <button
          className="join-team__primary"
          onClick={() => navigate("/", { state: { authPage: "signup" } })}
        >
          Create my login
        </button>
        <button
          className="join-team__secondary"
          onClick={() => navigate("/", { state: { authPage: "login" } })}
        >
          I already have a login
        </button>
      </>
    );
  };

  return (
    <div className="join-team">
      <Navbar />
      <main className="join-team__card">{body()}</main>
    </div>
  );
};

export default JoinTeamPage;
