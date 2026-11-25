import { useEffect, useState } from "react";
import { getSignupOffer, validateCoupon } from "../services/artistServices";
import { forgetSavedCode, savedCode } from "./attribution";

/** a discount code applied on the payment step */
export interface AppliedCoupon {
  code: string;
  description: string;
  percentOff?: number | null;
  amountOff?: number | null;
  /** "once" codes only come off the first payment */
  duration?: string | null;
}

interface CouponDetails {
  name?: string | null;
  percent_off?: number | null;
  amount_off?: number | null;
  duration?: string | null;
}

/** What the API's code check returned, worded for the payment step. */
export const couponToApplied = (
  code: string,
  details: CouponDetails | null | undefined,
): AppliedCoupon => {
  const percentOff = details?.percent_off ?? null;
  const amountOff = details?.amount_off ?? null;
  const name = details?.name || code;
  const first = details?.duration === "once" ? " your first payment" : "";
  let description = name;
  if (percentOff) description = `${name} — ${percentOff}% off${first}`;
  else if (amountOff) {
    description = `${name} — $${(amountOff / 100).toFixed(2)} off${first}`;
  }
  return { code, description, percentOff, amountOff, duration: details?.duration };
};

/** what the first payment comes to with a coupon */
export const priceAfter = (amount: number, coupon: AppliedCoupon) => {
  const savings = coupon.percentOff
    ? amount * (coupon.percentOff / 100)
    : coupon.amountOff
      ? coupon.amountOff / 100
      : 0;
  return Math.max(0, Math.round((amount - savings) * 100) / 100);
};

export type SavedOffer =
  | { status: "none" }
  /** code is null while asking the API for the signup offer */
  | { status: "checking"; code: string | null }
  /** source: from a link or QR code, or the offer every new artist gets */
  | { status: "ready"; coupon: AppliedCoupon; source: "saved" | "signup" }
  | { status: "unusable"; code: string; message: string };

/**
 * The code a link or QR code brought, checked for the signed-in artist. A
 * code they can't use (their own, or after a first subscription) is
 * forgotten so it stops being offered.
 */
// one check per code, shared by the banner, the plans pop-up and Profile
const checks = new Map<string, Promise<SavedOffer>>();

// the signup offer (e.g. the holiday code), asked for once per page load
let signupOffer: Promise<string | null> | null = null;

/** for tests, and after signing out */
export const resetSavedOfferChecks = () => {
  checks.clear();
  signupOffer = null;
};

const signupOfferCode = (): Promise<string | null> => {
  if (!signupOffer) {
    signupOffer = getSignupOffer()
      .then((response) => {
        const body = response.data as { data?: { offer?: unknown }; offer?: unknown };
        const offer = (body?.data?.offer ?? body?.offer) as
          | { kind?: string; code?: unknown }
          | null
          | undefined;
        // a referral discount is applied at checkout without a code
        return offer?.kind === "code" && typeof offer.code === "string"
          ? offer.code
          : null;
      })
      .catch(() => {
        signupOffer = null;
        return null;
      });
  }
  return signupOffer;
};

const checkCode = (code: string): Promise<SavedOffer> => {
  let check = checks.get(code);
  if (!check) {
    check = validateCoupon(code)
      .then((response): SavedOffer => {
        const data = response.data?.data || response.data;
        if (data?.isValid === false) {
          forgetSavedCode();
          return {
            status: "unusable",
            code,
            message: data?.message || "This code can't be used.",
          };
        }
        return {
          status: "ready",
          coupon: couponToApplied(code, data?.coupon),
          source: "saved",
        };
      })
      .catch((): SavedOffer => {
        // a network problem: keep the code and try again next time; the
        // plans show as usual meanwhile
        checks.delete(code);
        return { status: "none" };
      });
    checks.set(code, check);
  }
  return check;
};

const NONE: SavedOffer = { status: "none" };

/**
 * The code a link or QR code brought, or else the offer every new artist
 * gets (the API decides which, e.g. the holiday code). A signup code that
 * can't be used is simply not offered: the artist never typed it.
 */
export const useSavedOffer = (enabled: boolean): SavedOffer => {
  const [wanted] = useState(enabled);
  const [code] = useState(() => (enabled ? savedCode() : null));
  const [offer, setOffer] = useState<SavedOffer>(
    wanted ? { status: "checking", code } : NONE,
  );

  useEffect(() => {
    if (!wanted) return;
    let active = true;
    const result: Promise<SavedOffer> = code
      ? checkCode(code)
      : signupOfferCode().then((signupCode) =>
          signupCode
            ? checkCode(signupCode).then((checked) =>
                checked.status === "ready"
                  ? { ...checked, source: "signup" as const }
                  : NONE,
              )
            : NONE,
        );
    result.then((next) => {
      if (active) setOffer(next);
    });
    return () => {
      active = false;
    };
  }, [wanted, code]);

  return offer;
};
