import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../services/artistServices";
import { ATTRIBUTION_COOKIE, captureAttribution } from "../../utils/attribution";
import { SignInSuccessWithAuthResult } from "./authUtils";

vi.mock("../../firebase/firebase", () => ({ auth: {}, signInWithPopup: vi.fn() }));
vi.mock("../../services/artistServices", async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  createArtist: vi.fn(),
}));

const mocked = vi.mocked(api);

const authResult = {
  providerId: "password",
  user: {
    email: "ada@example.com",
    displayName: "Ada",
    getIdToken: () => Promise.resolve("firebase-token"),
  },
} as never;

describe("signing up from the web app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = `${ATTRIBUTION_COOKIE}=; Path=/; Max-Age=0`;
  });

  it("sends where the artist came from along with the sign-in", async () => {
    captureAttribution({ search: "?utm_source=instagram&ref=glow-7k2q", pathname: "/" }, "");
    mocked.createArtist.mockResolvedValue({
      data: { userCreated: true, access_token: "t", artist: { id: "a1", services: [] } },
    } as never);

    await SignInSuccessWithAuthResult(authResult, vi.fn(), vi.fn(), vi.fn());

    expect(mocked.createArtist).toHaveBeenCalledWith("firebase-token", {
      attribution: expect.objectContaining({ source: "instagram", ref: "GLOW-7K2Q" }),
      platform: "web",
    });
  });

  it("still signs in with nothing remembered", async () => {
    mocked.createArtist.mockResolvedValue({
      data: { userCreated: false, access_token: "t", artist: { id: "a1", services: [] } },
    } as never);
    const navigate = vi.fn();

    await SignInSuccessWithAuthResult(authResult, navigate, vi.fn(), vi.fn());

    expect(mocked.createArtist).toHaveBeenCalledWith("firebase-token", {
      attribution: null,
      platform: "web",
    });
    expect(navigate).toHaveBeenCalled();
  });
});
