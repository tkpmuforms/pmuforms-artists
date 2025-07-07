"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UnauthenticatedNavbar from "../layout/UnauthenticatedNavbar";
import ImageSlider from "../components/ImageSlider";
import "./auth.scss";
import LoginPage from "./authsubs/login/Login";
import SignupPage from "./authsubs/sigup/SignUp";
import {
  GoogleLoginSvg,
  FacebookLoginSvg,
  AppleLoginSvg,
} from "../assets/svgs/AuthSvg";

type AuthPage = "login" | "signup";

const Auth: React.FC = () => {
  const [page, setPage] = useState<AuthPage>("signup");
  const [showMobileAuth, setShowMobileAuth] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePageChange = (newPage: AuthPage): void => setPage(newPage);

  const handleGetStarted = () => {
    setShowMobileAuth(true);
  };

  const handleBackToSlider = () => {
    setShowMobileAuth(false);
  };

  if (isMobile) {
    return (
      <>
        <UnauthenticatedNavbar />
        <div className="auth-main-container mobile">
          {!showMobileAuth ? (
            // Mobile Slider View
            <div className="mobile-slider-view">
              <div className="auth-slider-section">
                <ImageSlider />
              </div>

              <button className="get-started-button" onClick={handleGetStarted}>
                Get Started
              </button>
            </div>
          ) : (
            <div className="mobile-auth-view">
              <div className="auth-form-section">
                <div className="auth-container">
                  {page === "login" ? <LoginPage /> : <SignupPage />}

                  <p className="before-socials">Or sign in with</p>
                  <div className="social-signin">
                    <GoogleLoginSvg />
                    <FacebookLoginSvg />
                    <AppleLoginSvg />
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
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div style={{ width: "100%", backgroundColor: "#f8f9fa" }}>
      <UnauthenticatedNavbar />
      <div className="auth-main-container desktop">
        <div className="auth-slider-section">
          <ImageSlider />
        </div>
        <div className="auth-form-section">
          <div className="auth-container">
            {page === "login" ? <LoginPage /> : <SignupPage />}

            <p className="before-socials">Or sign in with</p>
            <div className="social-signin">
              <GoogleLoginSvg />
              <FacebookLoginSvg />
              <AppleLoginSvg />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
