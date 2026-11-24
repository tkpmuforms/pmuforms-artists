import { Check, Copy, Mail, MessageSquare, Share2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  type ReferralSummary,
  getReferralSummary,
} from "../../services/artistServices";
import { LoadingSmall } from "../../components/loading/Loading";
import "./refer.scss";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const shareText = (amount: string, link: string, code: string) =>
  `I use PMU Forms for my consent forms, aftercare and client follow-ups. Sign up with my link and your first month is free (${amount} off your first payment): ${link} Or enter my code ${code} when you subscribe.`;

/** Each artist's referral link, how it works, and what they've earned. */
const ReferPage: React.FC = () => {
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  useEffect(() => {
    getReferralSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="refer-page">
        <p className="refer-page__error" role="alert">
          Couldn't load your referral link. Refresh the page to try again.
        </p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="refer-page">
        <LoadingSmall />
      </div>
    );
  }

  const amount = money(summary.rewardCents);
  const message = shareText(amount, summary.link, summary.code);

  const copy = async (text: string, what: "link" | "message") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      toast.success(what === "link" ? "Link copied" : "Message copied");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this:", text);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "PMU Forms", text: message });
    } catch {
      // the share sheet was closed
    }
  };

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="refer-page">
      <header className="refer-page__header">
        <h1>Refer an artist, get {amount}</h1>
        <p>
          Know an artist still using paper forms? Share your link or code. Their
          first month is free ({amount} off their first payment), and you get{" "}
          {amount} in credit when they pay.
        </p>
      </header>

      <section className="refer-card" aria-label="Your referral link">
        <h2>Your link</h2>
        <div className="refer-link">
          <input
            readOnly
            value={summary.link}
            aria-label="Your referral link"
            onFocus={(e) => e.target.select()}
          />
          <button
            className="refer-btn refer-btn--primary"
            onClick={() => copy(summary.link, "link")}
          >
            {copied === "link" ? <Check size={16} /> : <Copy size={16} />}
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="refer-muted">
          Your code: <strong>{summary.code}</strong>. Friends can also type it
          on the payment step.
        </p>

        <div className="refer-share">
          {canShare && (
            <button className="refer-btn" onClick={nativeShare}>
              <Share2 size={16} /> Share
            </button>
          )}
          <a
            className="refer-btn"
            href={`sms:?&body=${encodeURIComponent(message)}`}
          >
            <MessageSquare size={16} /> Text a friend
          </a>
          <a
            className="refer-btn"
            href={`mailto:?subject=${encodeURIComponent("Try PMU Forms")}&body=${encodeURIComponent(message)}`}
          >
            <Mail size={16} /> Email
          </a>
          <button
            className="refer-btn"
            onClick={() => copy(message, "message")}
          >
            {copied === "message" ? <Check size={16} /> : <Copy size={16} />}{" "}
            Copy message for Instagram
          </button>
        </div>
      </section>

      <section className="refer-stats" aria-label="Your referrals">
        <div className="refer-stat">
          <span className="refer-stat__value">{summary.invited}</span>
          <span className="refer-stat__label">Signed up</span>
        </div>
        <div className="refer-stat">
          <span className="refer-stat__value">{summary.paid}</span>
          <span className="refer-stat__label">Paid</span>
        </div>
        <div className="refer-stat">
          <span className="refer-stat__value">
            {money(summary.creditEarnedCents)}
          </span>
          <span className="refer-stat__label">Credit earned</span>
        </div>
      </section>

      <section className="refer-card" aria-label="How it works">
        <h2>How it works</h2>
        <ol className="refer-steps">
          <li>
            <strong>Share your link</strong> with artists you know, your
            trainees or your Instagram followers.
          </li>
          <li>
            <strong>They sign up</strong> and get {amount} off their first
            payment when they subscribe in the web app.
          </li>
          <li>
            <strong>You get {amount} in credit</strong> once they've paid. It
            comes off your next card payment for PMU Forms.
          </li>
        </ol>
        <p className="refer-muted">
          Credit is used on subscriptions paid by card in the web app. If you
          pay through the App Store or Google Play, your credit stays on your
          account until you subscribe in the web app. Up to{" "}
          {summary.maxRewardsPerYear} rewards a year.
        </p>
      </section>
    </div>
  );
};

export default ReferPage;
