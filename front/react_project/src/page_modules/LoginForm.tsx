import React, { useState, useEffect } from "react";
import socketIOClient from 'socket.io-client';
import '../App.css'

const LoginForm: React.FC = () => {
    return (
        <div className="block">
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