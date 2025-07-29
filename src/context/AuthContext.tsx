import React, { createContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthenticated, setLoading, setUser, User } from "../redux/auth";
import axiosInstance, {
  getAccessToken,
  isValidToken,
} from "../utils/axios/axiosSetup";
import { RootState } from "../redux/store";

// Testing flag - set to false when you want real authentication
const TESTING_MODE = true;

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
  isAuthenticated: true, // Default to true for testing
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
      // For testing: always set authenticated to true
      console.log("TESTING MODE: Setting authenticated to true");
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

    // Real authentication logic (will run when TESTING_MODE is false)
    const initializeAuth = async () => {
      dispatch(setLoading(true));

      try {
        const token = getAccessToken();
        console.log("Token found:", !!token);

        if (token && isValidToken(token)) {
          console.log("Token is valid, setting authenticated to true");
          setAuthHeader(token);
          dispatch(setAuthenticated(true));
        } else {
          console.log(
            "Token is invalid or missing, setting authenticated to false"
          );
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
