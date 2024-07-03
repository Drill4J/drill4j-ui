import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <div>
      Please contact Drill4J instance administrator to request
      password reset
      <br/>
      <br/>
      <Link to="/sign-in">Back to Sign In</Link>
    </div>
  );
};

export default ForgotPassword;
