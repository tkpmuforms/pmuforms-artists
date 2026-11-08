import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthenticated, setLoading, setUser } from "../redux/auth";
import { User } from "../redux/types";
import axiosInstance, {
  getAccessToken,
  isValidToken,
} from "../utils/axios/axiosSetup";
import { RootState } from "../redux/store";
import { createArtist } from "../services/artistServices";
import { mobileAuthHandoff } from "../utils/mobileAuth";

const TESTING_MODE = false;

export const setAuthHeader = (token?: string) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

interface AuthContextValue {
  method: string;
  logout: () => void;
  handleAuthSuccess: (user: User, token: string) => void;
  handleAuthFail: () => void;
  user: User;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  method: "JWT",
  logout: () => {},
  handleAuthSuccess: () => {},
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
  const initializationStarted = useRef(false);
  const [mobileAuthPending, setMobileAuthPending] = useState(
    mobileAuthHandoff !== null
  );

  const handleAuthSuccess = (user: User, token: string) => {
    dispatch(setLoading(false));
    dispatch(setUser(user));
    dispatch(setAuthenticated(true));
    setAuthHeader(token);
  };

  const handleAuthFail = useCallback(() => {
    localStorage.removeItem("accessToken");
    dispatch(setLoading(false));
    dispatch(setAuthenticated(false));
    dispatch(setUser({}));
    setAuthHeader();
  }, [dispatch]);

  useEffect(() => {
    if (initializationStarted.current) {
      return;
    }
    initializationStarted.current = true;

    if (TESTING_MODE) {
      setMobileAuthPending(false);
      dispatch(setLoading(false));
      dispatch(setAuthenticated(true));
      dispatch(
        setUser({
          _id: "test-user-123",
          email: "test@example.com",
          businessName: "Test Business",
        })
      );
      return;
    }

    const initializeAuth = async () => {
      dispatch(setLoading(true));

      try {
        if (mobileAuthHandoff) {
          const response = await createArtist(
            mobileAuthHandoff.firebaseToken
          );
          const artist = response.data?.artist;
          const webToken = response.data?.access_token ?? "";

          if (!artist || !isValidToken(webToken)) {
            throw new Error("Unable to verify the mobile sign-in session");
          }

          localStorage.setItem("accessToken", webToken);
          localStorage.setItem("userId", artist.id ?? artist._id ?? "");
          localStorage.setItem("userEmail", artist.email ?? "");
          setAuthHeader(webToken);
          dispatch(setUser(artist));
          dispatch(setAuthenticated(true));
          return;
        }

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
        setMobileAuthPending(false);
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch, handleAuthFail]);

  const logout = () => {
    if (TESTING_MODE) {
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
    loading: loading || mobileAuthPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
