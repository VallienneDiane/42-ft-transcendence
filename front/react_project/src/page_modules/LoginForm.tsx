import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
/*
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
}*/

const socket = io();

function LoginForm(): JSX.Element {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [lastPong, setLastPong] = useState(null);

    useEffect(() => {
        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnected', () => {
            setIsConnected(false);
        });

        socket.on('pong', () => {
            const bug : any = new Date().toISOString();
            setLastPong(bug);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('pong');
        };
    }, []);

    const sendPing = () => {
        socket.emit('ping');
    }

    return (
        <div>
            <p>Connected: { isConnected === true ? 'YES' : 'NO' } </p>
            <p>Last pong: { lastPong || '-' } </p>
            <button onClick={ sendPing }>Send ping </button>
        </div>
    );
}

export default LoginForm;