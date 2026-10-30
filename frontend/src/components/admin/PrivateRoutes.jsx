import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  let tokenIsCurrent = false;

  if (token) {
    try {
      const payload = token.split(".")[1];
      const normalizedPayload = payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const paddedPayload = normalizedPayload.padEnd(
        Math.ceil(normalizedPayload.length / 4) * 4,
        "=",
      );
      const decodedPayload = JSON.parse(atob(paddedPayload));
      tokenIsCurrent = Number.isInteger(decodedPayload.exp)
        && decodedPayload.exp > Date.now() / 1000;
    } catch {
      tokenIsCurrent = false;
    }
  }

  if (!tokenIsCurrent) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
