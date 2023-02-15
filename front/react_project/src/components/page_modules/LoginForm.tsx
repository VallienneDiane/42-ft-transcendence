import React from "react";

const LoginForm: React.FC = () => {
    return (
        <div >
            <h1>Login page</h1>
            <form className="login">
            <input
            type="text"
            placeholder="Enter your login ..."
            name="login"
            />
            <button>Submit</button>
        </form>
        </div>
    )
}

export default LoginForm;