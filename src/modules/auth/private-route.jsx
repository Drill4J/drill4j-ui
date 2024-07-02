import React from "react";
import { useNavigate, Outlet } from "react-router-dom";
import useCheckRole from "./use-check-role-hook";

export const PrivateRoute = ({ role }) => {
  const { isAuthorized, error, retry } = useCheckRole(role);
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center" }}>
      {error ? (
        <>
          <h1>Authentication request failed.</h1>
          <p>{error.message}</p>
        </>
      ) : (
        isAuthorized && <Outlet />
      )}
      <button onClick={retry}>Try Again</button>
      <button onClick={() => navigate(-1)}>Go Back</button>
      <button onClick={() => navigate('/sign-in')}>Go to Sign In</button>
    </div>
  );
};
