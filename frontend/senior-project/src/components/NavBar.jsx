import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/upscale-logo.png";
import "./navbar.css";

const NavBar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/home" className="nav-logo">
            <div className="logo-wrapper">
              <img src={logo} alt="Upscale logo" /> 
            </div>
            <span className="logo-text">Upscale</span>
          </Link>

          <div className="nav-links">
            <Link 
              to="/learningCenter" 
              className={`nav-link ${isActive('/learningCenter') ? 'active' : ''}`}
            >
              <span>Learning Center</span>
              <div className="link-underline"></div>
            </Link>
            <Link 
              to="/budget" 
              className={`nav-link ${isActive('/budget') ? 'active' : ''}`}
            >
              <span>Budgeting</span>
              <div className="link-underline"></div>
            </Link>
            <Link 
              to="/news" 
              className={`nav-link ${isActive('/news') ? 'active' : ''}`}
            >
              <span>News</span>
              <div className="link-underline"></div>
            </Link>
            <Link 
              to="/stocks" 
              className={`nav-link ${isActive('/stocks') ? 'active' : ''}`}
            >
              <span>Live Stocks</span>
              <div className="link-underline"></div>
            </Link>
          </div>
        </div>

        <div className="nav-right">
          <Link to="/signUp" className="signup-btn">
            <span>Sign Up</span>
            <div className="btn-glow"></div>
          </Link>
          <Link to="/login" className="login-btn">
            <span>Log in</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
