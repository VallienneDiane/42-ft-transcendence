import React, { useState, useEffect } from "react";
import { Socket } from 'socket.io-client';
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../services/account.service";
import { IMessageToSend, Message, IDest } from "../models";

function MessageDisplay(value: {sender: string, text: string}): JSX.Element {
    const [me, setMe] = useState<boolean>(false);
    const playload: JwtPayload = accountService.readPayload()!;

    useEffect(() => {
    if (playload.login === value.sender) {
        setMe(true);
    }}, )

    return (
        <div className={me ? "bubble sent" : "bubble received"}>
            <div className="messageUserName">{value.sender}</div>
            <div className="messageText">{value.text}</div>
        </div>
    )
}

export class MessageList extends React.Component<{history: Message[], action: any, socket: Socket}, {}> {
    constructor(props: {history: Message[], action: any, socket: Socket}) {
        super(props);
    }

    componentDidMount(): void {
        this.props.socket!.on("newMessage", (data: IMessageToSend) => {
            console.log('message from nest newMessage: ' + data.content + ', ' + data.sender);
            this.props.action({id: data.date.toString(), text: data.content, sender: data.sender});
        });

        this.props.socket!.on('selfMessage', (data: IMessageToSend) => {
            console.log('message from nest selfMessage: ' + data.content + ', ' + data.sender);
            this.props.action({id: data.date.toString(), text: data.content, sender: data.sender});
        })

        this.props.socket!.on('notice', (data: string) => {
            console.log(data);
            let date = new Date();
            this.props.action({id: date.toString(), text: data, sender: "Message from server :"});
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('newMessage');
        this.props.socket!.off('notice');
        this.props.socket!.off('selfMessage')
    }

    render() {
        const tmpList: Message[] = this.props.history!;
        const listItems: JSX.Element[] = tmpList.reverse().map(
            (message) => <MessageDisplay key={message.id} sender={message.sender!} text={message.text} />
        );
        return (
            <div className="messageList">
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
        let content: string = this.state.text;
        let room: string = this.props.dest!.Loc;
        let isChannel: boolean = this.props.dest!.isChannel;
        this.props.socket!.emit('addMessage', content);
        this.setState({ text: '' });
    }

    render() {
        return (
            <div className="sendMessage">
                <form className="sendMessageForm" onSubmit={this.sendMessage}>
                    <input type="textarea" className="inputMessage" placeholder="Type your message..." value={this.state.text} onChange={this.handleMessage} />
                    <input type="submit" value="Send" />
                </form>
            </div>
        )
    }
}
