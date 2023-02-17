import React, { useContext } from "react";
import NavBar from "./Navbar";

const LoginForm: React.FC = () => {
    return (
        <div >
            <NavBar/>
            <h1>Login page</h1>
            <form className="login">
            <input
            type="text"
            placeholder="Enter your login ..."
            name="login"
            />
            <button>Submit</button>
            <a href="/signin">Not registered ? Sign In !</a>
        </form>
        </div>
    )
}

export default LoginForm;