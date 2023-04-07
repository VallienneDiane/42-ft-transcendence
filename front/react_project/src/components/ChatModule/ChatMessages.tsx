import React, { useState, useEffect } from "react";
import { Socket } from 'socket.io-client';
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { userService } from "../../services/user.service";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IMessageToSend, Message, IDest } from "../../models";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

class MessageDisplay extends React.Component<{message: Message, prevSender: string, last: boolean}, {
    playload: JwtPayload, me: boolean, sameSender: boolean}> {
    constructor(props: {message: Message, prevSender: string, last: boolean}) {
        super(props);
        this.state = { playload: accountService.readPayload()!, 
        me: false, 
        sameSender: false };
        this.setTimeAgo = this.setTimeAgo.bind(this);
    }

    componentDidMount(): void {
        // console.log("prev", this.props.prevSender, "new", this.props.message.sender);
        if (this.props.prevSender === this.props.message.sender)
            this.setState({ sameSender: true });
        if (this.state.playload.login === this.props.message.sender)
            this.setState({me: true});
    }

    setTimeAgo() {
        const prev: Date = new Date(this.props.message.id);
        const now: Date = new Date();
        const secDiff: number = Math.round((now.getTime() - prev.getTime()) / 1000);
        let diff: number = secDiff / (24 * 60 * 60);
        if (diff > 1)
            return Math.round(diff) + "d ago";
        diff = secDiff / (60 * 60);
        if (diff > 1)
            return Math.round(diff) + "h ago";
        diff = secDiff / 60;
        if (diff > 1)
            return Math.round(diff) + "m ago";
        return("Now");
    }

    getProfilePicture() {

    }

    render() {
        return (
            <div className={this.state.me ? "message sent" : "message received"}>
                {(this.state.sameSender === false) && <div className="messageUserName">{this.props.message.sender}</div>}
                <div className="bubble">
                    <div className="messageText">{this.props.message.text}</div>
                </div>
                {this.props.last && <div className="messageDate">{this.setTimeAgo()}</div>}
            </div>
        )
    }
}

export class MessageList extends React.Component<{history: Message[], action: any, socket: Socket}, {}> {
    constructor(props: {history: Message[], action: any, socket: Socket}) {
        super(props);
    }

    componentDidMount(): void {
        this.props.socket.on("newMessage", (data: IMessageToSend) => {
            console.log('message from nest newMessage: ' + data.content + ', ' + data.sender);
            this.props.action({id: data.date.toString(), text: data.content, sender: data.sender});
        });

        this.props.socket.on('selfMessage', (data: IMessageToSend) => {
            console.log('message from nest selfMessage: ' + data.content + ', ' + data.sender);
            this.props.action({id: data.date.toString(), text: data.content, sender: data.sender});
        })

        this.props.socket.on('notice', (data: string) => {
            console.log(data);
            let date = new Date();
            this.props.action({id: date.toString(), text: data, sender: "Message from server :"});
        })
    }

    componentWillUnmount(): void {
        this.props.socket.off('newMessage');
        this.props.socket.off('notice');
        this.props.socket.off('selfMessage');
    }

    render() {
        const tmpList: Message[] = this.props.history!;
        const listItems: JSX.Element[] = tmpList.reverse().reduce((acc: JSX.Element[], message: Message, index: number, tmpList: Message[]) => {
            const length: number = tmpList.length;
            const prevSender: string = index < (length - 1) ? tmpList[index + 1].sender! : '';
            let lastMessage : boolean = false;
            if (index === 0 || (index > 0 && tmpList[index - 1].sender !== tmpList[index].sender))
                lastMessage = true;
            const messageDisplay = <MessageDisplay key={message.id} message={message} prevSender={prevSender!} last={lastMessage}/>;
            acc.push(messageDisplay);
            return acc;
        }, []);

        return (
            <div id="messageList">
                {listItems}
            </div>
        );
    }
}

export class SendMessageForm extends React.Component<{dest: IDest, socket: Socket}, {text: string}> {
    constructor(props: {dest: IDest, socket: Socket}) {
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
        if (this.state.text.trim() !== '') {
            let content: string = this.state.text;
            this.props.socket.emit('addMessage', {message: content});
            this.setState({ text: '' });
        }
    }

    render() {
        return (
            <div id="sendMessage">
                <form className="sendMessageForm" onSubmit={this.sendMessage}>
                    <input type="textarea" placeholder="Type your message..." value={this.state.text} onChange={this.handleMessage} />
                    <button className="send">
                        <FontAwesomeIcon className="svgSend" icon={faPaperPlane} />
                    </button>
                </form>
            </div>
        )
    }
}
