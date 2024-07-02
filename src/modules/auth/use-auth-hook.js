import { useState, useEffect } from "react";
import axios from "axios";

const useAuth = (requiredRole) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(null);

  const checkAuthAndRole = async () => {
    try {
      const response = await axios.get("/api/user-info");
      const userRole = response.data.role;
      if (userRole === requiredRole) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      if (error.response) {
        // Request made and server responded with a status code
        const status = error.response.status;
        if (status >= 500) {
          setError({ type: "server-error", message: `Internal server error (${status})` });
        } else if (status === 404) {
          setError({ type: "not-found", message: "Resource not found (404)" });
        } else if (status === 401) {
          const errorMessage = error.response.data.errorMessage || "You don't have the necessary permissions to access this page";
          setError({ type: "client-error", message: `${errorMessage} (${status})` });
        } else if (status >= 400) {
          const errorMessage = error.response.data.errorMessage || `Bad request or validation error`;
          setError({ type: "client-error", message: `${errorMessage} (${status})` });
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError({ type: "network-error", message: "Network error, API is unavailable" });
      } else {
        // Something happened in setting up the request that triggered an error
        setError({ type: "unknown-error", message: "Unknown error occurred" });
      }
    }
  };

  useEffect(() => {
    checkAuthAndRole();
  }, [requiredRole]);

  return { isAuthorized, error, retry: checkAuthAndRole };
};

export default useAuth;
