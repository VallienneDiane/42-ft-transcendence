import React, { useState, useEffect } from "react";
import socketIOClient from 'socket.io-client';
import './ChatModule.css'

const socket = socketIOClient("127.0.0.1:3000", {transports : ['websocket']})

interface Message {
    text: string;
    senderName?: string;
}

interface ChatHistory {
    messages: Message[];
}

interface ChatDestination {
    dest: string;
    action?: any;
}

function ListMessage(value: Message): JSX.Element {
    return (
        <div className="message">
            <div className="messageUserName">{value.senderName}</div>
            <div className="bubble">{value.text}</div>
        </div>
    )   
}

class MessageList extends React.Component<ChatDestination, ChatHistory> {
    constructor(props: ChatDestination) {
        super(props);
        this.state = { messages: [] };
    }

    componentDidMount(): void {
        socket.on('newMessage', (...data: string[]) => {
            if (data[0] == this.props.dest) {
                console.log('message from nest : ' + data);
                var pouet: Message = {text : data[2], senderName: data[1]};
                this.setState({
                    messages: [...this.state.messages, pouet]
                });
            }
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
            <div className="messageList">
                {listItems}
            </div>
        );
    }
}

function Header(title: ChatDestination) {
    let location: string;
    console.log(title);
    if (title.dest[0] == '_') {
        location = 'Welcome to channel ' + title.dest.substring(1);
    }
    else {
        location = 'Current discussion with ' + title.dest;
    }
    return (
        <div className="chatMessageHeader">
            <h1>{location}</h1>
            First test
        </div>
    )
}

class SendMessageForm extends React.Component<ChatDestination, Message> {
    constructor(props: ChatDestination) {
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
        socket.emit('chat', 'send', this.props.dest, this.state.text);
        console.log(this.state.text);
        this.setState({ text: '' });
    }

    render() {
        return (
            <div className="sendMessage">
                <form className="sendMessageForm" onSubmit={this.sendMessage}>
                    <input type="textarea" placeholder="Type your message..." value={this.state.text} onChange={this.handleMessage} />
                    <input type="submit" value="Send" />
                </form>
            </div>
        )
    }
}

class ChangeDestination extends React.Component<ChatDestination, Message> {
    constructor(props : ChatDestination) {
        super(props);
        this.state = { text: '' };
        this.handleDestination = this.handleDestination.bind(this);
        this.changeDestination = this.changeDestination.bind(this);
    }

    handleDestination(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ text: event.target.value });
    }

    changeDestination(event: any) {
        event.preventDefault();
        console.log("event target value : " + event.target.value);
        this.props.action(event.target.value);
    }

    render() {
        return (
            <div className="changeLocation">
                <form className="changeLocationForm" onSubmit={this.changeDestination}>
                    <input type="textarea" placeholder="insert the new destination..." value={this.state.text} onChange={this.handleDestination} />
                    <input type="submit" value="change" />
                </form>
            </div>
        )
    }
}

export default class ChatModule extends React.Component<{}, ChatDestination> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: '_general'};
        this.changeLoc = this.changeLoc.bind(this);
    }

    changeLoc(newDest: string) {
        this.setState({dest: newDest});
    }

    render() {
        return (
            <div className="chatWrapper">
                <div className="chatMessageWrapper">
                    <Header dest={this.state.dest} />
                    <MessageList dest={this.state.dest}/>
                    <SendMessageForm dest={this.state.dest} />
                    <ChangeDestination dest={this.state.dest} action={this.changeLoc} />
                </div>
            </div>
        )
    }
}
