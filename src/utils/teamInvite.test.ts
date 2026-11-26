import { beforeEach, describe, expect, it } from "vitest";
import {
  forgetTeamInvite,
  saveTeamInvite,
  savedTeamInvite,
  teamInviteMismatch,
} from "./teamInvite";

describe("saved team invite", () => {
  beforeEach(() => sessionStorage.clear());

  it("is fine with no invite open", () => {
    expect(teamInviteMismatch("anyone@x.com")).toBeNull();
  });

  it("accepts the invited email in any case", () => {
    saveTeamInvite({ email: "Mia@Studio.com", businessName: "Glow" });
    expect(savedTeamInvite()).toEqual({ email: "mia@studio.com", businessName: "Glow" });
    expect(teamInviteMismatch(" MIA@studio.com ")).toBeNull();
  });

  it("stops another email, which would start a new business", () => {
    saveTeamInvite({ email: "mia@studio.com", businessName: "Glow" });
    expect(teamInviteMismatch("other@x.com")).toMatch(
      /This invite is for mia@studio.com\. Sign in with that email to join Glow's team/,
    );
    expect(teamInviteMismatch(null)).not.toBeNull();
  });

  it("can be dismissed", () => {
    saveTeamInvite({ email: "mia@studio.com", businessName: "Glow" });
    forgetTeamInvite();
    expect(savedTeamInvite()).toBeNull();
    expect(teamInviteMismatch("other@x.com")).toBeNull();
  });
});
