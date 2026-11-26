import { useEffect, useState } from "react";
import useAuth from "../context/useAuth";
import type { ActorRef } from "../redux/types";
import { getTeamPeople, type TeamPerson } from "../services/teamServices";

// one request per page load; names rarely change mid-session
let cached: Promise<TeamPerson[]> | null = null;

const load = () => {
  if (!cached) {
    cached = getTeamPeople()
      .then(({ data }) => data.people ?? [])
      .catch(() => {
        cached = null;
        return [];
      });
  }
  return cached;
};

/** Forget the names, e.g. after someone changes theirs. */
export const forgetTeamPeople = () => {
  cached = null;
};

/**
 * Names for the ids saved on records ("Added by", "By"): the owner's userId
 * or a team member's id. Older records only ever have the owner's.
 */
export const useTeamPeople = () => {
  const [people, setPeople] = useState<TeamPerson[]>([]);
  useEffect(() => {
    let live = true;
    load().then((found) => live && setPeople(found));
    return () => {
      live = false;
    };
  }, []);
  const owner = people.find((p) => p.role === "owner");
  return {
    people,
    ownerName: owner?.name ?? "",
    nameOf: (id?: string | null) =>
      (id && people.find((p) => p.id === id)?.name) || "",
  };
};

/**
 * "You", or the name of whoever did something, from the ActorRef or id saved
 * with it. `hasTeam` is false for someone working alone, who doesn't need
 * names on everything.
 */
export const useWhoDid = () => {
  const { me } = useAuth();
  const { people, ownerName, nameOf } = useTeamPeople();
  const label = (
    ref?: ActorRef | string | null,
    { ownerIfMissing = false }: { ownerIfMissing?: boolean } = {},
  ) => {
    const id = typeof ref === "string" ? ref : ref?.id;
    if (!id) {
      // saved before teams: the owner did it
      if (!ownerIfMissing) return "";
      return me?.role === "owner" ? "You" : ownerName;
    }
    if (me && id === me.id) return "You";
    return nameOf(id) || (typeof ref === "object" ? ref?.name ?? "" : "");
  };
  return { hasTeam: people.length > 1, label };
};
