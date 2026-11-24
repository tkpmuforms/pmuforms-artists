/**
 * Where a visitor came from (ad, referral link, search...), remembered so it
 * can be saved on the artist's account when they sign up.
 *
 * Shared contract with the landing page (pmuforms.com), which has a copy of
 * this file: one cookie, `pmu_attr`, on `.pmuforms.com` so a visit to
 * pmuforms.com?utm_source=... is still known when the artist signs up on
 * artist.pmuforms.com. The value is encodeURIComponent(JSON.stringify(...)).
 *
 * Rules:
 * - A visit with campaign parameters (utm_*, gclid, fbclid, ttclid, ref or
 *   code) replaces what was stored
 *   replaces what was stored, but a stored referral code is kept unless the
 *   new visit has its own.
 * - Otherwise, a first visit from another website is stored (e.g. Google).
 * - Otherwise nothing changes.
 */

export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  /** referral code from a friend's link */
  ref?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  landingPage?: string;
  referrer?: string;
  firstSeenAt?: string;
}

export const ATTRIBUTION_COOKIE = "pmu_attr";
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

const PARAMS: Array<[keyof Attribution, string]> = [
  ["source", "utm_source"],
  ["medium", "utm_medium"],
  ["campaign", "utm_campaign"],
  ["content", "utm_content"],
  ["term", "utm_term"],
  ["ref", "ref"],
  ["gclid", "gclid"],
  ["fbclid", "fbclid"],
  ["ttclid", "ttclid"],
];

const clean = (value: string | null | undefined, max = 100) => {
  const text = (value ?? "").trim();
  return text ? text.slice(0, max) : undefined;
};

/**
 * A discount code from a link: an artist's referral code (GLOWSTUD-7K2Q) or
 * a promotion code (PMUFORMS2026, PMU_20_OFF). Anything else is dropped.
 */
export const normalizeReferralCode = (value: string | null | undefined) => {
  const code = (value ?? "").trim().toUpperCase();
  return /^[A-Z0-9_-]{3,30}$/.test(code) ? code : undefined;
};

const isOwnSite = (host: string) =>
  host === "pmuforms.com" || host.endsWith(".pmuforms.com");

const compact = (value: Attribution): Attribution =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== ""),
  ) as Attribution;

export function readAttribution(): Attribution | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${ATTRIBUTION_COOKIE}=`));
  if (!entry) return null;
  try {
    const parsed = JSON.parse(
      decodeURIComponent(entry.slice(ATTRIBUTION_COOKIE.length + 1)),
    );
    return parsed && typeof parsed === "object" ? compact(parsed) : null;
  } catch {
    return null;
  }
}

function writeAttribution(value: Attribution) {
  const { hostname, protocol } = window.location;
  const parts = [
    `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(compact(value)))}`,
    "Path=/",
    `Max-Age=${MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ];
  // shared between pmuforms.com and artist.pmuforms.com
  if (isOwnSite(hostname)) parts.push("Domain=.pmuforms.com");
  if (protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
}

/** Call once per page load, before anything rewrites the URL. */
export function captureAttribution(
  location: Pick<Location, "search" | "pathname"> = window.location,
  referrer: string = document.referrer,
): Attribution | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(location.search);
  const stored = readAttribution();
  const now = new Date().toISOString();

  const fromUrl: Attribution = {};
  for (const [key, param] of PARAMS) {
    const value =
      key === "ref"
        ? // ?code= (QR codes, Refer links) or ?ref= (older links)
          normalizeReferralCode(params.get("code") ?? params.get(param))
        : clean(params.get(param), key.endsWith("clid") ? 200 : 100);
    if (value) fromUrl[key] = value;
  }

  let referrerUrl: string | undefined;
  try {
    const url = referrer ? new URL(referrer) : null;
    if (url && !isOwnSite(url.hostname) && url.hostname !== window.location.hostname) {
      referrerUrl = clean(`${url.origin}${url.pathname}`, 200);
    }
  } catch {
    referrerUrl = undefined;
  }

  const landingPage = clean(location.pathname, 200);

  if (Object.keys(fromUrl).length > 0) {
    const next: Attribution = {
      ...fromUrl,
      ref: fromUrl.ref ?? stored?.ref,
      landingPage,
      referrer: referrerUrl,
      firstSeenAt: now,
    };
    writeAttribution(next);
    return compact(next);
  }

  if (!stored && referrerUrl) {
    const next: Attribution = { referrer: referrerUrl, landingPage, firstSeenAt: now };
    writeAttribution(next);
    return next;
  }

  return stored;
}

/**
 * The discount code a link or QR code brought, kept until it's used: the
 * plans pop-up applies it, and the login page says it's saved.
 */
export const savedCode = (): string | null => {
  try {
    return readAttribution()?.ref ?? null;
  } catch {
    return null;
  }
};

/** after it's been used, or turned out not to be usable */
export const forgetSavedCode = () => {
  try {
    const stored = readAttribution();
    if (!stored?.ref) return;
    const { ref: _used, ...rest } = stored;
    void _used;
    writeAttribution(rest);
  } catch {
    // nothing saved, or cookies blocked
  }
};
