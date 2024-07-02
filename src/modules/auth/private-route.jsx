import React from "react";
import { Outlet } from "react-router-dom";
import useAuth from "./use-auth-hook";
import NoPermission from "./no-permission";

export const PrivateRoute = ({ role }) => {
  const { isAuthorized, error, retry } = useAuth(role);

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h1>Authentication request failed.</h1>
        <p>
          Please make sure the API service is running.
        </p>
        <button onClick={retry}>Try Again</button>
      </div>
    );
  }

  return isAuthorized ? <Outlet /> : <NoPermission />;
};
