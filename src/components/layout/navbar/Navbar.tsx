import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoSvg } from "../../../assets/svgs/AuthSvg";
import "./navbar.scss";

const Navbar = () => {
  const navigate = useNavigate();
  const [, setMobileMenuVisible] = useState(false);
  const mobileMenuRef = useRef(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      mobileMenuRef.current &&
      !(mobileMenuRef.current as HTMLDivElement).contains(event.target as Node)
    ) {
      setMobileMenuVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleHomeNavigate = () => {
    navigate("/");
  };

  return (
    <div className="navbar">
      {/* Logo */}
      <div onClick={handleHomeNavigate} className="logo">
        <LogoSvg />
      </div>

      {/* <div className="hamburger-menu" onClick={toggleMobileMenu}>
        &#9776;
      </div> */}

      {/* Navigation Links */}
      {/* <div
        ref={mobileMenuRef}
        className={`links ${mobileMenuVisible ? "visible" : ""}`}
      >
        <ul>
          <li>
            <a href={videolink} target="_blank" rel="noopener noreferrer">
              [Watch Video] “How to use PMU Forms”
            </a>
          </li>
          <li>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </li>
          <li>
            <Link to="/support">Contact Support</Link>
          </li>
        </ul>
      </div> */}

      {/* Buttons (Hidden in Mobile) */}
      {/* <div className="buttons">
        <button onClick={CreatenewClick} className="create-an-account">
          Create an Account
        </button>
      </div> */}
    </div>
  );
};

export default Navbar;
