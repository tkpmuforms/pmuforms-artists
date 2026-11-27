import { describe, expect, it } from "vitest";
import { monthName, planLimitFrom } from "./planLimits";

const body = {
  statusCode: 403,
  message:
    "You've reached the 10-client limit on the Starter plan. Upgrade to Pro for unlimited clients, or delete a client you no longer need.",
  code: "STARTER_CLIENT_LIMIT",
  kind: "clients",
  limit: 10,
};

describe("planLimitFrom", () => {
  it("reads the response body the interceptor rejects with", () => {
    expect(planLimitFrom(body)).toEqual({
      code: "STARTER_CLIENT_LIMIT",
      kind: "clients",
      message: body.message,
      limit: 10,
    });
  });

  it("reads an axios-shaped error too", () => {
    expect(
      planLimitFrom({
        response: {
          data: {
            statusCode: 403,
            message: "You've reached the 5 appointments allowed in December on the Starter plan.",
            code: "STARTER_APPOINTMENT_LIMIT",
            kind: "appointments",
            limit: 5,
          },
        },
      })?.kind,
    ).toBe("appointments");
  });

  it("ignores every other error", () => {
    expect(planLimitFrom({ statusCode: 400, message: "Client already exists" })).toBeNull();
    expect(planLimitFrom({ code: "ERR_NETWORK", message: "Network Error" })).toBeNull();
    expect(planLimitFrom(new Error("boom"))).toBeNull();
    expect(planLimitFrom(undefined)).toBeNull();
  });
});

describe("monthName", () => {
  it("names the month of a YYYY-MM key", () => {
    expect(monthName("2026-12")).toBe("December");
    expect(monthName("")).toBe("this month");
  });
});
