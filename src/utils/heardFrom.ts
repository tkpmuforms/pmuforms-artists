/**
 * "How did you hear about PMU Forms?", asked once during onboarding. The
 * values match the API's HEARD_FROM list (src/growth/attribution.ts).
 */
export const HEARD_FROM_OPTIONS = [
  { value: "google", label: "Google search" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "another_artist", label: "Another artist or friend" },
  { value: "academy_trainer", label: "A PMU academy or trainer" },
  { value: "app_store", label: "App Store" },
  { value: "other", label: "Other" },
] as const;

export type HeardFrom = (typeof HEARD_FROM_OPTIONS)[number]["value"];
