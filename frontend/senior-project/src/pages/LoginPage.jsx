import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import logo from "../assets/google.png";
import { auth } from '../firebase';
import "./formstyles.css";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); 

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('User logged in successfully!');
      
    } catch (error) {
      setError(error.message);
      console.error("Login error:", error);
    }
  };

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
                required
            />
            </label>

            <label className="auth-label">
            Password
            <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            </label>

            <button className="auth-button" type="submit">Log In</button>

            {error && <p className="auth-error">{error}</p>}

            <div className="auth-divider">OR</div>

            <a className="google-button" href="#">
            <img src={logo} alt="Google" />
            Continue with Google
            </a>
        </form>
        </div>
    </div>
    );

};

export default LoginPage;