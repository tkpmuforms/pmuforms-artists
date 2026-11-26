import { useEffect } from "react";
import { useDispatch } from "react-redux";
import useAuth from "../../context/useAuth";
import { setMe, setUser } from "../../redux/auth";
import { getAuthMe } from "../../services/artistServices";
import { forgetTeamPeople } from "../../utils/teamPeople";
import MemberNameModal from "./MemberNameModal";

// refresh who's signed in once per page load, and whenever it's unknown
let checkedThisLoad = false;

/**
 * Knows whether the owner or a team member is signed in, signs out someone
 * the owner removed, and asks a new team member for their name.
 */
const TeamGate = () => {
  const { me, user, isAuthenticated, logout } = useAuth();
  const dispatch = useDispatch();
  const known = !!me;

  useEffect(() => {
    if (!isAuthenticated || (known && checkedThisLoad)) return;
    checkedThisLoad = true;
    let live = true;
    getAuthMe()
      .then((response) => {
        if (!live) return;
        if (response?.data?.user) dispatch(setUser(response.data.user));
        dispatch(setMe(response?.data?.me ?? null));
      })
      .catch((error) => {
        // the owner took them off the team
        if (/no longer on this account's team/i.test(String(error?.message))) {
          logout();
        }
      });
    return () => {
      live = false;
    };
    // logout changes every render; the check only depends on these
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, known, dispatch]);

  if (me?.role !== "member" || (me.firstName && me.lastName)) return null;

  return (
    <MemberNameModal
      initial={{ firstName: me.firstName, lastName: me.lastName }}
      businessName={user?.businessName}
      onSaved={(name) => {
        forgetTeamPeople();
        dispatch(
          setMe({
            ...me,
            ...name,
            name: `${name.firstName} ${name.lastName}`,
          }),
        );
      }}
    />
  );
};

export default TeamGate;
