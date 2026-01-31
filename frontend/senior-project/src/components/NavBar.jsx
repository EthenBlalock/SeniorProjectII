import { Link } from "react-router-dom";
import logo from "../assets/upscale-logo.png";
import "./navbar.css";

const NavBar = () => {
  return (
    <nav className="nav">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/home" className="nav-logo">
            <img src={logo} alt="Upscale logo" />
            <span>Upscale</span>
          </Link>

          <Link to="/learningCenter">Learning Center</Link>
          <Link to="/budget">Budgeting</Link>
          <Link to="/news">News</Link>
          <Link to="/stocks">Live Stocks</Link>
        </div>

        <div className="nav-right">
          <Link to="/signUp" className="signup-btn">Sign Up</Link>
          <Link to="/login" className="login-link">Log in</Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
