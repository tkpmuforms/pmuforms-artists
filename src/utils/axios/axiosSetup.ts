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
  const decodedToken = JSON.parse(atob(accessToken.split(".")[1]));
  return decodedToken.exp * 1000 > new Date().getTime();
};

axiosInstance.defaults.headers["content-type"] = "application/json";
const accessToken = getAccessToken();

axiosInstance.interceptors.request.use((req) => {
  if (accessToken && isValidToken(accessToken)) {
    return req;
  }

  const pathname = history.location.pathname;
  if (pathname === "/" || pathname.includes("#")) {
    return req;
  }
  history.push("/", { sessionExpired: true });
  return req;
});

axiosInstance.defaults.headers.common.Authorization = `Bearer ${getAccessToken()}`;

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
