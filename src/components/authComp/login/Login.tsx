"use client";

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordForm from "../forgot-password/ForgotPasswordForm";
import "./login.scss";
import { signInWithEmailAndPassword } from "firebase/auth";
import { SignInSuccessWithAuthResult } from "../../../pages/auth/authUtils";
import useAuth from "../../../context/useAuth";
import { toast } from "react-hot-toast";
import { auth } from "../../../firebase/firebase";
import { Eye, EyeOff } from "lucide-react";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { handleAuthSuccess } = useAuth();
  const [forgetpassword, setForgotPassword] = useState(false);

  const navigate = useNavigate();
  const showAlert = (
    type: "error" | "success" | "warning" | "info",
    message: string
  ) => {
    if (type === "error" || type === "success") {
      toast[type](message);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      SignInSuccessWithAuthResult(
        result,
        navigate,
        handleAuthSuccess,
        showAlert
      );
    } catch (error: unknown) {
      console.error("LoginFailed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed! Try again later.";
      showAlert(
        "error",
        errorMessage.includes("user-not-found")
          ? "Account not found, Please signup and try again."
          : errorMessage
      );
    }
  };
  return (
    <>
      {forgetpassword ? (
        <ForgotPasswordForm onCancel={() => setForgotPassword(false)} />
      ) : (
        <div className="login-page">
          <div className="login-container">
            <h2>Hi, Welcome Back</h2>
            <p className="subtext">
              Enter your login details to access your account
            </p>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="forgot-password">
                <p onClick={() => setForgotPassword(true)}>Forgot Password?</p>
              </div>

              <button type="submit" className="login-button">
                Login
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;
