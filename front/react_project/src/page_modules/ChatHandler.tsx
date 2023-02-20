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
    const [history, setHistory] = useState<string[]>([]);
    const [bug, setBug] = useState<boolean>(false); // bug is here to realize React that a change was done and update the history

    useEffect(() => {

        socket.on('newMessage', (data: string) => {
            console.log('message from nest : ' + data);
            history.push(data);
            setHistory(history);
            setBug((bug) => {
                if (bug)
                    return false;
                return true;
            });
            console.log('chat history : ' + history);
        });

        return () => {
            socket.off('newMessage');
        };
    
    }, [history.length]);
    
    const sendMessage = (event: any) => {
        event.preventDefault(); // permet d'eviter le chargement d'une nouvelle page
        // alert(message);
        socket.emit('message', message);
        setMessage('');
    }

    const handleMessage = (message: any) => {
        setMessage(message.target.value);
    }

    return (
        <div className="chat">
            <p>Current chat :</p>
            <ListMessages strings={history} />
            <form onSubmit={sendMessage}>
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