/**
 * Conversion events for ads (Meta, Google), sent through Google Tag Manager.
 * Off unless VITE_GTM_ID=GTM-XXXXXXX is set at build time; tags are set up in
 * GTM. Events carry no personal data (no names, emails or client details).
 *
 *   sign_up   a new PMU Forms account was created   { method }
 *   purchase  a web subscription was started        { value, currency, plan }
 *             plan: "starter", "monthly" or "yearly" (Pro), or "other"
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const GTM_ID = (import.meta.env.VITE_GTM_ID ?? "").trim();
const VALID_GTM_ID = /^GTM-[A-Z0-9]{4,}$/;
let started = false;

export const analyticsEnabled = () =>
  typeof window !== "undefined" && VALID_GTM_ID.test(GTM_ID);

export function initAnalytics(): void {
  if (started || !analyticsEnabled()) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!analyticsEnabled()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}

export const trackSignUp = (method: string) => trackEvent("sign_up", { method });

export const trackPurchase = (
  plan: "starter" | "monthly" | "yearly" | "other",
  value: number,
) =>
  trackEvent("purchase", {
    plan,
    value: Number.isFinite(value) ? value : 0,
    currency: "USD",
  });
