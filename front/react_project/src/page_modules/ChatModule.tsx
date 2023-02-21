import React, { useState, useEffect } from "react";
import socketIOClient from 'socket.io-client';

const socket = socketIOClient("127.0.0.1:3000", {transports : ['websocket']})

interface Message {
    text: string;
    senderName: string;
    change?: any;
}

interface ChatHistory {
    messages: Message[];
}

type MyState = {
    chatHistory: ChatHistory;
    message: Message;
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
            var pouet: Message = {text : data[1], senderName: data[0]};
            this.setState({
                messages: [...this.state.messages, pouet]
            });
        });
        console.log('chat history : ' + this.state.messages);
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

class SendMessageForm extends React.Component<Message> {
    constructor(props: Message) {
        super(props);
        this.handleMessage = this.handleMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }

    handleMessage(event: React.ChangeEvent<HTMLInputElement>) {
        this.props.change(event.target.value);
    }

    sendMessage(event: any) {
        event.preventDefault();
        socket.emit('message', this.props.text);
        console.log(this.props.text);
        this.props.change('');
    }

    render() {
        const text = this.props.text;
        const senderName = this.props.senderName;
        return (
            <div>
                <form onSubmit={this.sendMessage}>
                    <label>
                        Type your message :  
                        <input type="text" value={text} onChange={this.handleMessage} />
                    </label>
                    <input type="submit" value="send" />
                </form>
            </div>
        )
    }
}

export default class ChatModule extends React.Component<{}, MyState> {
    constructor(props: {}) {
        super(props);
        this.handleMessageChange = this.handleMessageChange.bind(this);
        this.state = { 
            chatHistory: { messages: []}, 
            message: { text: '', senderName: ''} 
        };
    }

    handleMessageChange(text: string) {
        this.setState({message: {text, senderName: 'blop'}});
    }

    render() {
        return (
            <div className="chat">
                <Title />
                <MessageList />
                <SendMessageForm text={this.state.message.text} senderName={this.state.message.senderName} change={this.handleMessageChange}/>
            </div>
        )
    }
}
