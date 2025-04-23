"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ForgotPasswordForm from "./ForgotPasswordForm"
import "./login.scss"

interface LoginFormValues {
  email: string
  password: string
}

const LoginPage: React.FC = () => {
const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const { handleAuthSuccess } = useAuth();
  const [forgetpassword, setForgotPassword] = useState(false);


  const navigate = useNavigate();

  const handleLogin = async (e) => {
    // e.preventDefault();
    // try {
    //   const result = await signInWithEmailAndPassword(auth, email, password);
    //   SignInSuccessWithAuthResult(
    //     result,
    //     navigate,
    //     handleAuthSuccess,
    //     showAlert
    //   );
    // } catch (error) {
    //   console.error("Failed to log in:", error);
    //   showAlert("error", `Login failed! Invalid email or password.`);
    // }
  };

  return (
    <>
      {forgetpassword ? (
        <ForgotPasswordForm onCancel={() => setForgotPassword(false)} />
      ) : (
        <div className="login-page">
          <div className="login-container">
            <h2>
              Sign in now to complete required forms for your next appointment
            </h2>
            <p className="subtext">
              Important: Don't wait until the day of your appointment. Some of
              this information must be filled out a few days in advance.
            </p>

            {/* Email and Password Login Form */}
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
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                />
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

export default LoginPage
