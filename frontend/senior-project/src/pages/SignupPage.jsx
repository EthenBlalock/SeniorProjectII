import React, { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db} from "../firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore"; 
import { useAuth } from "../hooks/AuthContext";
import "./formstyles.css";

const SignUpPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { currentUser, loadingUser } = useAuth();

  useEffect(() => {
    if (!loadingUser && currentUser) {
      navigate("/home", { replace: true });
    }
  }, [currentUser, loadingUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user

      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email: user.email,
        createdAt: serverTimestamp()
      });

      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Signup error:", err);
      alert(err.message);
    }
  };

  return (
    <div className="auth-page">
        <div className="auth-card">
        <h2 className="auth-title">Sign Up</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label">
            First Name
            <input
                className="auth-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
            />
            </label>
            <label className="auth-label">
            Last Name
            <input
                className="auth-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
            />
            </label>
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

            <button className="auth-button" type="submit">Sign Up</button>

            <p className="auth-footer">
            Already registered? <Link to="/login">Login</Link>
            </p>
        </form>
        </div>
    </div>
    );
};

export default SignUpPage;
