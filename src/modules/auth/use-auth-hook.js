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
      setIsAuthorized(false);
      setError(error);
    }
  };

  useEffect(() => {
    checkAuthAndRole();
  }, [requiredRole]);

  return { isAuthorized, error, retry: checkAuthAndRole };
};

export default useAuth;
