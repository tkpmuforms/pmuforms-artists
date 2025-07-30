import { CircularProgress } from "@mui/material";

export const Loading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
    }}
  >
    <CircularProgress size={100} sx={{ color: "#8e2d8e" }} />
  </div>
);

export const LoadingSmall = ({ height = "400px" }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: height,
    }}
  >
    <CircularProgress size={100} sx={{ color: "#8e2d8e" }} />
  </div>
);
