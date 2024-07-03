import React from "react";
import { useNavigate, Outlet } from "react-router-dom";
import useCheckRole from "./use-check-role-hook";
import useAuth from "./use-auth-hook";

export const PrivateRoute = ({ roles }) => {
  const { isSignedIn, error: authError } = useAuth();
  const { hasRole, error: missingRoleError } = useCheckRole(roles);
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center" }}>
      {!isSignedIn || !hasRole ? (
        <>
          <h1>Authentication request failed.</h1>
          <p>{authError || missingRoleError}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
          <button onClick={() => navigate('/sign-in')}>Go to Sign In</button>
        </>
      ) : (
        isSignedIn && <Outlet />
      )}
    </div>
  );
};
