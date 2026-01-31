import React from "react";
import logo from "../assets/google.png";

const LoginPage = () => {

    return (
        <div>
            <h1>Login Page</h1>
            <div id="login">
            <form action="">
                <input type="text" placeholder="email"/><br />
                <input type="text" placeholder="password"/> <br />
                <input type="submit" value="Sign In" />
                <p>Sign up or log in with</p>
                <a href="/"><img src={logo} alt="" /></a>
            </form>
            </div>
        </div>
    );

}

export default LoginPage;