import React, { useState, useEffect } from "react";
import socketIOClient from 'socket.io-client';

const socket = socketIOClient("127.0.0.1:3000", {transports : ['websocket']})

interface Istring {
    string: string;
}

interface Istrings {
    strings: string[];
}

function ListMessage(value: Istring): JSX.Element {
    return <li>{value.string}</li>;
}

function ListMessages(value: Istrings): JSX.Element {
    const _strings: string[] = value.strings;
    const listItems: JSX.Element[] = _strings.map(
        (string, index) => <ListMessage key={index} string={string} />
    );

    return (
        <ul>{listItems}</ul>
    );
}

function ChatHandler(): JSX.Element {
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {

        socket.on('newMessage', (...args: string[]) => {
            setMessages(args);
        });

        return () => {
            socket.off('newMessage');
        };
    
    }, []);
    
    const sendMessage : any = (message: string) => {
        socket.emit('message', message);
    }

    const handleMessage = (message: any) => {
        setMessage(message.target.value);
    }

    return (
        <div className="block">
            <p>Current chat :</p>
            <ListMessages strings={messages} />
            <form onSubmit={sendMessage(message)}>
                <label>
                    type your message : 
                    <input type="text" value={message} onChange={handleMessage} />
                </label>
                <input type="submit" value="send" />
            </form>
        </div>
    )

}

export default ChatHandler;