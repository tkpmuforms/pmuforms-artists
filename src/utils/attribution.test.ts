import { beforeEach, describe, expect, it } from "vitest";
import {
  ATTRIBUTION_COOKIE,
  captureAttribution,
  normalizeReferralCode,
  readAttribution,
} from "./attribution";

const clearCookie = () => {
  document.cookie = `${ATTRIBUTION_COOKIE}=; Path=/; Max-Age=0`;
};

const visit = (search: string, referrer = "", pathname = "/") =>
  captureAttribution({ search, pathname }, referrer);

describe("signup attribution", () => {
  beforeEach(clearCookie);

  it("remembers ad parameters from the URL", () => {
    visit("?utm_source=instagram&utm_medium=paid_social&utm_campaign=nov&fbclid=abc");
    expect(readAttribution()).toMatchObject({
      source: "instagram",
      medium: "paid_social",
      campaign: "nov",
      fbclid: "abc",
      landingPage: "/",
    });
  });

  it("keeps a friend's referral code when a later ad visit has none", () => {
    visit("?ref=glow-7k2q");
    visit("?utm_source=google&utm_medium=cpc");
    expect(readAttribution()).toMatchObject({ source: "google", ref: "GLOW-7K2Q" });
  });

  it("stores another website only on the first visit", () => {
    visit("", "https://www.google.com/search?q=pmu+forms");
    expect(readAttribution()).toMatchObject({ referrer: "https://www.google.com/search" });
    visit("", "https://www.bing.com/");
    expect(readAttribution()?.referrer).toBe("https://www.google.com/search");
  });

  it("ignores visits from our own sites and plain direct visits", () => {
    visit("", "https://pmuforms.com/templates");
    expect(readAttribution()).toBeNull();
    visit("");
    expect(readAttribution()).toBeNull();
  });

  it("drops invalid referral codes", () => {
    visit("?ref=<script>");
    expect(readAttribution()).toBeNull();
    expect(normalizeReferralCode(" abcd-12 ")).toBe("ABCD-12");
    expect(normalizeReferralCode("ab")).toBeUndefined();
  });

  it("survives a damaged cookie", () => {
    document.cookie = `${ATTRIBUTION_COOKIE}=%7Bnot-json; Path=/`;
    expect(readAttribution()).toBeNull();
  });
});
