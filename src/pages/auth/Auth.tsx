"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppleLoginSvg,
  GoogleLoginSvg,
  LogoSvg,
  MobileAppleLoginSvg,
  MobileGoogleLoginSvg,
} from "../../assets/svgs/AuthSvg";
import LoginPage from "../../components/authComp/login/Login";
import SignupPage from "../../components/authComp/signup/SignUp";
import Navbar from "../../components/layout/navbar/Navbar";
import ImageSlider from "../../components/slider/ImageSlider";
import useAuth from "../../context/useAuth";
import { appleProvider, googleProvider } from "../../firebase/firebase";
import "./auth.scss";
import { HandleSocialLogin } from "./authUtils";
import SavedCodeNotice from "./SavedCodeNotice";
import TeamInviteNotice from "./TeamInviteNotice";
import { teamInviteMismatch } from "../../utils/teamInvite";

type AuthPage = "login" | "signup";
type SignupStep = "email" | "password" | "verification";

const Auth: React.FC = () => {
  const location = useLocation();
  // the join page sends invited people straight to signup or login
  const [page, setPage] = useState<AuthPage>(
    (location.state as { authPage?: AuthPage } | null)?.authPage === "signup"
      ? "signup"
      : "login",
  );
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
    // with a team invite open, another email would start a new business
    const mismatch = teamInviteMismatch(email);
    if (mismatch) {
      toast.error(mismatch);
      return;
    }
    setSignupEmail(email);
    setSignupStep("password");
  };

  const handleStepChange = (newStep: SignupStep) => {
    setSignupStep(newStep);
  };

  const handleBackToEmailStep = () => {
    setSignupStep("email");
  };

  const handleNavigateToLogin = () => {
    setPage("login");
    setSignupStep("email");
    setSignupEmail("");
  };

  const shouldHideSlider = () => {
    if (page === "login") return false;
    return ["password", "verification", "business", "services"].includes(
      signupStep,
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

  const showAlert = (
    type: "error" | "success" | "warning" | "info",
    message: string,
  ) => {
    (toast as any)[type](message);
  };

  if (isMobile) {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-main-container mobile">
          {/* phones go straight to the form: no intro slides to tap through */}
          <div
              className={`mobile-auth-view ${
                shouldHideSlider() ? "full-screen-step" : ""
              }`}
            >
              <div className="auth-form-section">
                <div className="auth-container">
                  <TeamInviteNotice />
            <SavedCodeNotice />
                  {page === "login" ? (
                    <LoginPage />
                  ) : (
                    <SignupPage
                      currentStep={signupStep}
                      email={signupEmail}
                      onEmailSubmit={handleEmailSubmit}
                      onStepChange={handleStepChange}
                      onBack={handleBackToEmailStep}
                      onNavigateToLogin={handleNavigateToLogin}
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
                              showAlert,
                            )
                          }
                        />
                        {/* <MobileFacebookLoginSvg
                          onClick={() =>
                            HandleSocialLogin(
                              facebookProvider,
                              navigate,
                              handleAuthSuccess,
                              showAlert
                            )
                          }
                        /> */}
                        {/* <MobileAppleLoginSvg
                          onClick={() =>
                            HandleSocialLogin(
                              appleProvider,
                              navigate,
                              handleAuthSuccess,
                              showAlert
                            )
                          }
                        /> */}
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
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
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
            <TeamInviteNotice />
            <SavedCodeNotice />
            {page === "login" ? (
              <LoginPage />
            ) : (
              <SignupPage
                currentStep={signupStep}
                email={signupEmail}
                onEmailSubmit={handleEmailSubmit}
                onStepChange={handleStepChange}
                onBack={handleBackToEmailStep}
                onNavigateToLogin={handleNavigateToLogin}
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
                        showAlert,
                      )
                    }
                  />
                  {/* <FacebookLoginSvg
                    onClick={() =>
                      HandleSocialLogin(
                        facebookProvider,
                        navigate,
                        handleAuthSuccess,
                        showAlert
                      )
                    }
                  /> */}
                  {/* <AppleLoginSvg
                    onClick={() =>
                      HandleSocialLogin(
                        appleProvider,
                        navigate,
                        handleAuthSuccess,
                        showAlert
                      )
                    }
                  /> */}
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
