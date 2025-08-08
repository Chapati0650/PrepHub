import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface GoogleSignInProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
  className?: string;
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess, onError, className = '' }) => {

  return (
    <div className={`w-full ${className}`}>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            console.log('Google sign-in successful, credential received');
            onSuccess(credentialResponse.credential);
          } else {
            console.error('Google sign-in failed: No credential received');
            onError();
          }
        }}
        onError={() => {
          console.error('Google sign-in error occurred');
          onError();
        }}
        useOneTap={false}
        auto_select={false}
        theme="filled_blue"
        size="large"
        text="continue_with"
        shape="rectangular"
        ux_mode="popup"
        popup_type="window"
      />
    </div>
  );
};

export default GoogleSignIn;