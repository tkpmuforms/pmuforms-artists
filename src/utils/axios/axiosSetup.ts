import axios from "axios";
import { createBrowserHistory } from "history";

const history = createBrowserHistory();

const baseURL = "https://admin.pmuforms.com/";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "content-type": "application/json",
  },
});

export const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const isValidToken = (accessToken: string) => {
  if (!accessToken) {
    return false;
  }
  try {
    const decodedToken = JSON.parse(atob(accessToken.split(".")[1]));
    return decodedToken.exp * 1000 > new Date().getTime();
  } catch {
    return false;
  }
};

axiosInstance.defaults.headers["content-type"] = "application/json";

axiosInstance.interceptors.request.use((req) => {
  // This endpoint accepts a Firebase ID token in the request body and is also
  // used to bootstrap sessions handed off by the mobile app. Never attach a
  // previous Safari user's bearer token to this identity exchange.
  if (req.url === "/api/auth/artist/create") {
    delete req.headers.Authorization;
    return req;
  }

  const accessToken = getAccessToken();

  if (accessToken && isValidToken(accessToken)) {
    req.headers.Authorization = `Bearer ${accessToken}`;
    return req;
  }

  delete req.headers.Authorization;

  const pathname = history.location.pathname;
  if (pathname === "/" || pathname.includes("#")) {
    return req;
  }
  history.push("/", { sessionExpired: true });
  return req;
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) =>
    Promise.reject(
      (error.response && error.response.data) || {
        message: "Something went wrong!",
        error,
      }
    )
);

export default axiosInstance;
