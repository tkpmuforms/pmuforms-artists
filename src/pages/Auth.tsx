"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import UnauthenticatedNavbar from "../layout/UnauthenticatedNavbar"
import "./authpage.scss"
import LoginPage from "./authsubs/Login"
import SignupPage from "./authsubs/SignUp"
import { GoogleLoginSvg , FacebookLoginSvg, AppleLoginSvg} from "../assets/svgs/AuthSvg";


const Auth: React.FC = () => {
  const [page, setPage] = useState<"login" | "signup">("login")
  const navigate = useNavigate()

  const handlePageChange = (newPage: "login" | "signup") => setPage(newPage)

  return (
    <>
      <UnauthenticatedNavbar CreatenewClick={() => handlePageChange("signup")} />
       <div className="auth-container">
        {page === "login" ? <LoginPage /> : <SignupPage />}
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
        <p>Or sign in with</p>
        <div className="social-signin">
          <GoogleLoginSvg
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
        <p className="terms-text">
          By proceeding, you agree to our{" "}
          <Link to="/terms-and-agreement">Terms and conditions</Link> {"   "}and
          our <Link to="/privacy-policy">Privacy policy</Link>
        </p>
      </div>
    </>
  )
}

export default Auth
