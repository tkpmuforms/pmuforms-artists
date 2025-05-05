"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UnauthenticatedNavbar from "../layout/UnauthenticatedNavbar";
import "./auth.scss";
import LoginPage from "./authsubs/login/Login";
import SignupPage from "./authsubs/sigup/SignUp";
import {
  GoogleLoginSvg,
  FacebookLoginSvg,
  AppleLoginSvg,
} from "../assets/svgs/AuthSvg";

// Define a type for the page state
type AuthPage = "login" | "signup";

const Auth: React.FC = () => {
  const [page, setPage] = useState<AuthPage>("login");
  const navigate = useNavigate();

  const handlePageChange = (newPage: AuthPage): void => setPage(newPage);

  return (
    <>
      <UnauthenticatedNavbar
        CreatenewClick={() => handlePageChange("signup")}
      />
      <div className="auth-container">
        {page === "login" ? <LoginPage /> : <SignupPage />}

        <p className="before-socials">Or sign in with</p>
        <div className="social-signin">
          <GoogleLoginSvg
          // Uncomment and implement the onClick handler for social login
          // onClick={() =>
          //   HandleSocialLogin(
          //     googleProvider,
          //     navigate,
          //     handleAuthSuccess,
          //     showAlert
          //   )
          // }
          />
          <FacebookLoginSvg
          // Uncomment and implement the onClick handler for social login
          // onClick={() =>
          //   HandleSocialLogin(
          //     facebookProvider,
          //     navigate,
          //     handleAuthSuccess,
          //     showAlert
          //   )
          // }
          />
          <AppleLoginSvg
          // Uncomment and implement the onClick handler for social login
          // onClick={() =>
          //   HandleSocialLogin(
          //     appleProvider,
          //     navigate,
          //     handleAuthSuccess,
          //     showAlert
          //   )
          // }
          />
        </div>
        <div className="switch-auth">
          {page === "login" ? (
            <p className="switch-auth-text">
              Don't have an account?{" "}
              <button
                onClick={() => handlePageChange("signup")}
                className="switch-auth-button"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="switch-auth-text">
              Already have an account?{" "}
              <button
                onClick={() => handlePageChange("login")}
                className="switch-auth-button"
              >
                Log in
              </button>
            </p>
          )}
        </div>
        <p className="terms-text">
          By proceeding, you agree to our{" "}
          <Link to="/terms-and-agreement">Terms and conditions</Link> and our{" "}
          <Link to="/privacy-policy">Privacy policy</Link>
        </p>
      </div>
    </>
  );
};

export default Auth;
