import React, { useState, useEffect } from "react";
import socketIOClient from 'socket.io-client';

const socket = socketIOClient("127.0.0.1:3000", {transports : ['websocket']})

interface Message {
    text: string;
    senderName?: string;
}

interface ChatHistory {
    messages: Message[];
}

interface ChatLocation {
    location: string;
}

function ListMessage(value: Message): JSX.Element {
    return (
        <li>
            <div>{value.senderName}</div>
            <div>{value.text}</div>
        </li>
    )   
}

class MessageList extends React.Component<{}, ChatHistory> {
    constructor(props: {}) {
        super(props);
        this.state = { messages: [] };
    }

    componentDidMount(): void {
        socket.on('newMessage', (...data: string[]) => {
            console.log('message from nest : ' + data);
            var pouet: Message = {text : data[2], senderName: data[1]};
            this.setState({
                messages: [...this.state.messages, pouet]
            });
        });
        
        socket.on('notice', (data: string) => {
            console.log(data);
        })
    }

    componentWillUnmount(): void {
        socket.off('newMessage');
    }

    render() {
        const listItems: JSX.Element[] = this.state.messages.map(
            (message, id) => <ListMessage key={id} text={message.text} senderName={message.senderName} />
        );
        return (
            <ul className="messageList">
                {listItems}
            </ul>
        );
    }
}

function Title() {
    return (
        <div>
            <h1>Channel 1</h1>
        </div>
    )
}

class SendMessageForm extends React.Component<{}, Message> {
    constructor(props: {}) {
        super(props);
        this.state = { text: '' };
        this.handleMessage = this.handleMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }

    handleMessage(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ text: event.target.value });
    }

    sendMessage(event: any) {
        event.preventDefault();
        socket.emit('chat', 'send', '_general', this.state.text);
        console.log(this.state.text);
        this.setState({ text: '' });
    }

    render() {
        return (
            <div>
                <form onSubmit={this.sendMessage}>
                    <label>
                        Type your message :  
                        <input type="text" value={this.state.text} onChange={this.handleMessage} />
                    </label>
                    <input type="submit" value="send" />
                </form>
            </div>
        )
    }
}

export default class ChatModule extends React.Component<{}, ChatLocation> {
    constructor(props : {}) {
        super(props);
        this.state = {location: '_general'};
    }
    render() {
        return (
            <div className="chat">
                <Title />
                <MessageList />
                <SendMessageForm />
            </div>
        )
    }
}
