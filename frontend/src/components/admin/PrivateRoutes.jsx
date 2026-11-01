import { Navigate } from "react-router-dom";
import { clearStoredSession, getStoredSessionStartedAt, isSessionTokenCurrent } from "./sessionToken.js";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const tokenIsCurrent = isSessionTokenCurrent(token, Date.now(), getStoredSessionStartedAt());

  if (!tokenIsCurrent) {
    clearStoredSession();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
