"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  FacebookLoginSvg,
  GoogleLoginSvg,
  LogoSvg,
  MobileFacebookLoginSvg,
  MobileGoogleLoginSvg,
} from "../../assets/svgs/AuthSvg";
import Navbar from "../../components/layout/navbar/Navbar";
import ImageSlider from "../../components/slider/ImageSlider";
import useAuth from "../../context/useAuth";
import { googleProvider } from "../../firebase/firebase";
import { HandleSocialLogin } from "./authUtils";
import LoginPage from "../../components/authComp/login/Login";
import SignupPage from "../../components/authComp/sigup/SignUp";
import "./auth.scss";

type AuthPage = "login" | "signup";
type SignupStep =
  | "email"
  | "password"
  | "verification"
  | "business"
  | "services";

const Auth: React.FC = () => {
  const [page, setPage] = useState<AuthPage>("signup");
  const [showMobileAuth, setShowMobileAuth] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>("email");
  const [signupEmail, setSignupEmail] = useState<string>("");
  const { handleAuthSuccess } = useAuth();
  const navigate = useNavigate();

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
    if (newPage === "signup") {
      setSignupStep("email");
      setSignupEmail("");
    }
  };

  const handleEmailSubmit = (email: string) => {
    setSignupEmail(email);
    setSignupStep("password");
  };

  const handleStepChange = (newStep: SignupStep) => {
    setSignupStep(newStep);
  };

  const handleBackToEmailStep = () => {
    setSignupStep("email");
  };

  const handleGetStarted = () => {
    setShowMobileAuth(true);
  };

  const shouldHideSlider = () => {
    if (page === "login") return false;
    return ["password", "verification", "business", "services"].includes(
      signupStep
    );
  };

  const shouldShowSocialLogin = () => {
    if (page === "login") return true;
    return ["email", "password"].includes(signupStep);
  };

  const shouldShowAuthSwitch = () => {
    if (page === "login") return true;
    return ["email", "password"].includes(signupStep);
  };

  const showAlert = () => {
    toast.success("exe");
  };

  if (isMobile) {
    return (
      <>
        <Navbar />
        <div className="auth-main-container mobile">
          {!showMobileAuth ? (
            <div className="mobile-slider-view">
              <div className="auth-slider-section">
                <ImageSlider />
              </div>

              <button className="get-started-button" onClick={handleGetStarted}>
                Get Started
              </button>
            </div>
          ) : (
            <div
              className={`mobile-auth-view ${
                shouldHideSlider() ? "full-screen-step" : ""
              }`}
            >
              <div className="auth-form-section">
                <div className="auth-container">
                  {/* {signupStep === "email" && <LogoSvg />} */}
                  {page === "login" ? (
                    <LoginPage />
                  ) : (
                    <SignupPage
                      currentStep={signupStep}
                      email={signupEmail}
                      onEmailSubmit={handleEmailSubmit}
                      onStepChange={handleStepChange}
                      onBack={handleBackToEmailStep}
                    />
                  )}

                  {shouldShowSocialLogin() && (
                    <>
                      <p className="before-socials">
                        {page === "login"
                          ? "Or continue with"
                          : "Or sign up with"}
                      </p>
                      <div className="social-signin">
                        <MobileGoogleLoginSvg
                          onClick={() =>
                            HandleSocialLogin(
                              googleProvider,
                              navigate,
                              handleAuthSuccess,
                              showAlert
                            )
                          }
                        />
                        <MobileFacebookLoginSvg />
                      </div>
                    </>
                  )}

                  {shouldShowAuthSwitch() && (
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
                            Login
                          </button>
                        </p>
                      )}
                    </div>
                  )}
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
      <Navbar />
      <div
        className={`auth-main-container desktop ${
          shouldHideSlider() ? "full-screen-step" : ""
        }`}
      >
        {!shouldHideSlider() && (
          <div className="auth-slider-section">
            <ImageSlider />
          </div>
        )}
        <div className="auth-form-section">
          <div className="auth-container">
            {signupStep === "email" && <LogoSvg />}
            {page === "login" ? (
              <LoginPage />
            ) : (
              <SignupPage
                currentStep={signupStep}
                email={signupEmail}
                onEmailSubmit={handleEmailSubmit}
                onStepChange={handleStepChange}
                onBack={handleBackToEmailStep}
              />
            )}
            {shouldShowSocialLogin() && (
              <>
                <p className="before-socials">
                  {page === "login" ? "Or continue with" : "Or sign up with"}
                </p>
                <div className="social-signin">
                  <GoogleLoginSvg
                    onClick={() =>
                      HandleSocialLogin(
                        googleProvider,
                        navigate,
                        handleAuthSuccess,
                        showAlert
                      )
                    }
                  />
                  <FacebookLoginSvg />
                </div>
              </>
            )}
            {shouldShowAuthSwitch() && (
              <div className="switch-auth">
                {page === "login" ? (
                  <p className="switch-auth-text">
                    Don't have an account?{" "}
                    <button
                      onClick={() => handlePageChange("signup")}
                      className="switch-auth-button"
                      style={{ textDecoration: "none" }}
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
                      style={{ textDecoration: "none" }}
                    >
                      Login
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
