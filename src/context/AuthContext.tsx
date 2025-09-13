import React, { createContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthenticated, setLoading, setUser, User } from "../redux/auth";
import axiosInstance, {
  getAccessToken,
  isValidToken,
} from "../utils/axios/axiosSetup";
import { RootState } from "../redux/store";

const TESTING_MODE = false;

export const setAuthHeader = (token?: string) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

const AuthContext = createContext({
  method: "JWT",
  logout: () => {},
  handleAuthSuccess: (_user: User, _token: string) => {},
  handleAuthFail: () => {},
  user: {} as User,
  isAuthenticated: false,
  loading: false,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );

  const handleAuthSuccess = (user: User, token: string) => {
    dispatch(setLoading(false));
    dispatch(setUser(user));
    dispatch(setAuthenticated(true));
    setAuthHeader(token);
  };

  const handleAuthFail = () => {
    dispatch(setLoading(false));
    dispatch(setAuthenticated(false));
    dispatch(setUser({}));
    setAuthHeader();
  };

  useEffect(() => {
    if (TESTING_MODE) {
      dispatch(setLoading(false));
      dispatch(setAuthenticated(true));
      dispatch(
        setUser({
          id: "test-user-123",
          name: "Test User",
          email: "test@example.com",
        })
      );
      return;
    }

    const initializeAuth = async () => {
      dispatch(setLoading(true));

      try {
        const token = getAccessToken();

        if (token && isValidToken(token)) {
          setAuthHeader(token);
          dispatch(setAuthenticated(true));
        } else {
          handleAuthFail();
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        handleAuthFail();
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);

  const logout = () => {
    if (TESTING_MODE) {
      console.log("TESTING MODE: Logout called but not actually logging out");
      return;
    }

    setAuthHeader();
    dispatch(setLoading(false));
    dispatch(setAuthenticated(false));
    dispatch(setUser({}));

    const rawUri = localStorage.getItem("businessUri");
    const businessUri =
      rawUri && rawUri !== "null" && rawUri !== "undefined" ? rawUri : null;

    localStorage.clear();

    if (businessUri) {
      localStorage.setItem("businessUri", businessUri);
      navigate(`/${businessUri}`);
    } else {
      navigate("/");
    }
  };
  const value = {
    method: "JWT",
    logout,
    handleAuthSuccess,
    handleAuthFail,
    user,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
