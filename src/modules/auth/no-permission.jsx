import React from 'react';
import { useNavigate } from 'react-router-dom';

const NoPermission = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '20%' }}>
      <h1>You don't have the necessary permissions to access this page.</h1>
      <div>
        <button onClick={() => navigate(-1)}>Go Back</button>
        <button onClick={() => navigate('/sign-in')}>Go to Sign In</button>
      </div>
    </div>
  );
};

export default NoPermission;
