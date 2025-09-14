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
      <div onClick={handleHomeNavigate} className="logo">
        <LogoSvg />
      </div>
    </div>
  );
};

export default Navbar;
