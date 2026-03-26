import React, { useState } from 'react';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider} from 'firebase/auth';
import logo from "../assets/google.png";
import { auth } from '../firebase';
import { useAuth } from "../hooks/AuthContext";
import "./formstyles.css";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser, loadingUser } = useAuth();

  const provider = new GoogleAuthProvider();

  useEffect(() => {
    if (!loadingUser && currentUser) {
      navigate("/home", { replace: true });
    }
  }, [currentUser, loadingUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); 

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home", { replace: true });
    } catch (error) {
      setError(error.message);
      console.error("Login error:", error);
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setError(null); 

    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      setError(error.message);
      console.error("Google login error:", error);
    }

  }

  return (
    <div className="auth-page">
        <div className="auth-card">
        <h2 className="auth-title">Log in</h2>

        <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-label">
            Email
            <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}

            />
            </label>

            <label className="auth-label">
            Password
            <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            </label>

            <button className="auth-button" type="submit">Log In</button>

            {error && <p className="auth-error">{error}</p>}

            <div className="auth-divider">OR</div>

            <button type="button" className="google-button" onClick={handleGoogleLogin}>
            <img src={logo} alt="Google" />
            Continue with Google
            </button>
        </form>
        </div>
    </div>
    );

};

export default LoginPage;
