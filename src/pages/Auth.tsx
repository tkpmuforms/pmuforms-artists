"use client";

import React, { useEffect, useState } from "react";
import {
  AppleLoginSvg,
  FacebookLoginSvg,
  GoogleLoginSvg,
} from "../assets/svgs/AuthSvg";
import ImageSlider from "../components/ImageSlider";
import UnauthenticatedNavbar from "../layout/UnauthenticatedNavbar";
import "./auth.scss";
import LoginPage from "./authsubs/login/Login";
import SignupPage from "./authsubs/sigup/SignUp";

type AuthPage = "login" | "signup";
type SignupStep = "email" | "password";

const Auth: React.FC = () => {
  const [page, setPage] = useState<AuthPage>("signup");
  const [showMobileAuth, setShowMobileAuth] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>("email");
  const [signupEmail, setSignupEmail] = useState<string>("");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePageChange = (newPage: AuthPage): void => {
    setPage(newPage);
    // Reset signup step when switching between login/signup
    if (newPage === "signup") {
      setSignupStep("email");
      setSignupEmail("");
    }
  };

  const handleEmailSubmit = (email: string) => {
    setSignupEmail(email);
    setSignupStep("password");
  };

  const handleBackToEmailStep = () => {
    setSignupStep("email");
  };

  const handleGetStarted = () => {
    setShowMobileAuth(true);
  };

  if (isMobile) {
    return (
      <>
        <UnauthenticatedNavbar />
        <div className="auth-main-container mobile">
          {!showMobileAuth ? (
            // Mobile Slider View - only show if not on password step
            <div className="mobile-slider-view">
              <div className="auth-slider-section">
                <ImageSlider />
              </div>

              <button className="get-started-button" onClick={handleGetStarted}>
                Get Started
              </button>
            </div>
          ) : (
            // Mobile Auth View - show auth form
            <div
              className={`mobile-auth-view ${
                page === "signup" && signupStep === "password"
                  ? "password-step"
                  : ""
              }`}
            >
              {/* Only show slider section if not on password step */}
              {!(page === "signup" && signupStep === "password") && (
                <div className="auth-slider-section">
                  <ImageSlider />
                </div>
              )}
              <div className="auth-form-section">
                <div className="auth-container">
                  {page === "login" ? (
                    <LoginPage />
                  ) : (
                    <SignupPage
                      currentStep={signupStep}
                      email={signupEmail}
                      onEmailSubmit={handleEmailSubmit}
                      onBack={handleBackToEmailStep}
                    />
                  )}

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
      <div
        className={`auth-main-container desktop ${
          page === "signup" && signupStep === "password" ? "password-step" : ""
        }`}
      >
        {/* Only show slider if not on password step */}
        {!(page === "signup" && signupStep === "password") && (
          <div className="auth-slider-section">
            <ImageSlider />
          </div>
        )}
        <div className="auth-form-section">
          <div className="auth-container">
            {page === "login" ? (
              <LoginPage />
            ) : (
              <SignupPage
                currentStep={signupStep}
                email={signupEmail}
                onEmailSubmit={handleEmailSubmit}
                onBack={handleBackToEmailStep}
              />
            )}

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
