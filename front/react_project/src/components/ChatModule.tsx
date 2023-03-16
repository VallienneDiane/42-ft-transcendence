import React from "react";
import { accountService } from "../services/account.service";
import '../styles/ChatModule.scss'
import SocketContext from "./context";
import { Socket } from 'socket.io-client'
import { userService } from "../services/user.service";
import CreateChannel from "./CreateChannel"
import { IChat, UserData, IMessageToSend, Message, IDest, Users, IMessageEntity } from "../models";

function Header(title: IChat) {
    let location: string;
    if (title.dest!.isChannel) {
        location = 'Welcome to channel ' + title.dest!.Loc;
    }
    else {
        location = 'Current discussion with ' + title.dest!.Loc;
    }
    return (
        <div className="chatMessageHeader">
            <h1>{location}</h1>
        </div>
    )
}

class SearchChat extends React.Component<IChat, {
    text: string,
    users: {name: string, isChannel: boolean}[],
    channels: {name: string, isChannel: boolean}[],
    filtered: {name: string, isChannel: boolean}[]}
    > {
    constructor(props: IChat) {
        super(props);
        this.state = {
            text: '',
            users: [],
            channels: [],
            filtered: [],
        }
        this.fetchChannels = this.fetchChannels.bind(this);
        this.fetchUsers = this.fetchUsers.bind(this);
        this.displayList = this.displayList.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    fetchChannels() {
        this.props.socket!.emit('listChannel');
    }

    fetchUsers() {
        userService.getAllUsers()
        .then(response => {
            const users = response.data.map((user: UserData) => user.login);
            let newUserList: {name:string, isChannel:boolean}[] = [];
            users.forEach((user: string) => {
                newUserList.push({name: user, isChannel: false});
            })
            this.setState({users: newUserList});
        })
        .catch(error => {
            console.log(error);
        })
    }

    componentDidMount(): void {
        this.props.socket!.on('listChannel', (strs: string[]) => {
            let newChanList: {name: string, isChannel: boolean}[] = [];
            for (let str of strs)
                newChanList.push({name: str, isChannel: true});
            this.setState({channels: newChanList})});
        this.props.socket!.on('newUserConnected', () => {
            console.log("script is supposed to fetchUsers");
            this.fetchUsers()});
        this.fetchChannels();
        this.fetchUsers();

        this.props.socket!.on('newLocChannel', (chanName: string, chanHistory: IMessageEntity[]) => {
            console.log('socket ON newLocChannel', chanName, chanHistory);
            let newHistory: Message[] = [];
            for (let elt of chanHistory) {
                newHistory.push({id: elt.date.toString(), text: elt.content, sender: elt.sender})
            }
            this.props.action(newHistory);
            this.props.action2({Loc: chanName, isChannel: true});
        })

        this.props.socket!.on('newLocPrivate', (userName: string, chanHistory: IMessageEntity[]) => {
            console.log('socket ON newLocPrivate', userName, chanHistory);
            let newHistory: Message[] = [];
            for (let elt of chanHistory) {
                newHistory.push({id: elt.date.toString(), text: elt.content, sender: elt.sender})
            }
            this.props.action(newHistory);
            this.props.action2({Loc: userName, isChannel: false});
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('listChannel');
        this.props.socket!.off('newUserConnected');
        this.props.socket!.off('newLocChannel');
        this.props.socket!.off('newLocPrivate');
    }

    displayList(event: any) { //Ceci est un frigo
        this.setState({text: event.target.value});
        if (event.target.value) {
            this.setState(() => {
                const filteredUsers: {name: string, isChannel: boolean}[] =
                this.state.users.filter((user: {name: string, isChannel: boolean}) =>
                    user.name.startsWith(event.target.value));
                const filteredChannels: {name: string, isChannel: boolean}[] =
                this.state.channels.filter((channel: {name: string, isChannel: boolean}) =>
                    channel.name.startsWith(event.target.value));
                let toReturn: {name: string, isChannel: boolean}[] = [];
                if (filteredUsers.length > 0) {
                    if (filteredChannels.length > 0)
                        toReturn = [{name: "Users : ", isChannel: false},
                        ...filteredUsers, {name: "Channels : ",
                        isChannel: true},
                        ...filteredChannels];
                    else
                        toReturn = [{name: "Users : ", isChannel: false}, ...filteredUsers];
                }
                else if (filteredChannels.length > 0)
                    toReturn = [{name: "Channels : ", isChannel: true}, ...filteredChannels];
                else
                    toReturn = [];
                const filtered: {name: string, isChannel: boolean}[] = toReturn;
                return { filtered };
            });
        }
        else {
            this.setState({filtered: []});
        }
    }
    
    onClick(event: any) {
        let newLocWanted: IDest = {Loc: event.target.innerHTML, isChannel: event.target.value? true : false};
        this.props.socket?.emit('changeLoc', newLocWanted);
        this.setState({text: ''});
    }
    
    render() {
        return (
            <div id="searchBar">
                <form action="">
                    <input type="text" onChange={this.displayList} onClick={this.displayList} value={this.state.text} placeholder="Search"/>
                </form>
                <ul>
                    {this.state.filtered.map((user: {name: string, isChannel: boolean}, id: number) => (
                        <li key={id} value={user.isChannel? 1 : 0} onClick={this.onClick} >{user.name}</li>
                    ))}
                </ul>
            </div>
        )
    }
}

class ChannelList extends React.Component<IChat, Users> {
    constructor(props: IChat) {
        super(props);
        this.state = {channels: [], me: accountService.readPayload()!};
        this.changeLoc = this.changeLoc.bind(this);
    }
    
    changeLoc(channel: IDest) {
        this.props.socket!.emit('changeLoc', channel);  
        this.props.socket!.on('newLocChannel', (room: string, messages: IMessageEntity[]) => {
            console.log(room)
            this.props.action({Loc: room, isChannel: true});
            this.props.action2(messages);
        })
    }

    componentDidMount(): void {
        if (this.state.channels.length === 0)
        {
            this.props.socket!.emit('myChannels');
            this.props.socket!.on('listMyChannels', (strs: string[]) => { this.setState({ channels: strs }) });
        }
        // userService.getAllUsers()
        // .then((response) => {
            //     this.setState({ users: response.data });
            // })
            // .catch((error) => console.log(error));
    }

    componentWillUnmount(): void {
        this.props.socket!.off('newLocChannel');
        this.props.socket!.off('listMyChannels');
    }

    render() {
        return (
            <div className="channelListWrapper">
            <h2>Channels</h2>
            <ul className="channelList">
                { this.state.channels.map((channel) => { 
                    if (this.state.me.login !== channel)
                    { return (<li key={channel} onClick={() => this.changeLoc({Loc: channel, isChannel: true})}> {channel}</li> ) }
                })}
            </ul>
            <h2>DMs</h2>
        </div>
        )
    }
}

function MessageDisplay(value: {sender: string, text: string}): JSX.Element {
    // console.log(value);
    // console.log(value.sender, value.text);
    return (
        <div className="message">
            <div className="messageUserName">{value.sender}</div>
            <div className="bubble">{value.text}</div>
        </div>
    )
}

class MessageList extends React.Component<IChat, {}> {
    constructor(props: IChat) {
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

        this.props.socket!.on('notice', (data: string[]) => {
            console.log(data);
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('newMessage');
        this.props.socket!.off('notice');
        this.props.socket!.off('selfMessage')
    }

    render() {
        const tmpList: Message[] = this.props.history!;
        console.log("tmpList", tmpList)
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

class SendMessageForm extends React.Component<IChat, {text: string}> {
    constructor(props: IChat) {
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

export default class ChatModule extends React.Component<{}, IChat> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: {Loc: 'general', isChannel: true}, history: []};
        this.changeLoc = this.changeLoc.bind(this);
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
        this.handleHistory = this.handleHistory.bind(this);
    }
    
    changeLoc(newDest: IDest) {
        this.setState({dest: newDest});
    }

    handleNewMessageOnHistory(newMessage: Message) {
        const save: Message[] = this.state.history!;
        save.reverse();
        save.push(newMessage);
        console.log("after push", save);
        this.setState({
            history: save,
        });
    }

    handleHistory(newHistory: Message[]) {
        this.setState({ history: newHistory });
    }

    render() {
        return (  
            <SocketContext.Consumer > 
                { ({ socket }) => {
                    if (socket.auth.token != "undefined") {
                        return (
                        <div className="chatWrapper">
                            <div className="left">
                                <div className="leftHeader">
                                    <SearchChat socket={socket} action={this.handleHistory} action2={this.changeLoc} />
                                    <CreateChannel />
                                </div>
                                <ChannelList action={this.changeLoc} action2={this.handleHistory} socket={socket} />
                            </div>
                            <div className="chatMessageWrapper">
                                <Header dest={this.state.dest} />
                                <MessageList dest={this.state.dest} history={this.state.history} action={this.handleNewMessageOnHistory} socket={socket} />
                                <SendMessageForm dest={this.state.dest} socket={socket}/>
                            </div>
                        </div>)}
                    }
                }
            </SocketContext.Consumer>
        )
    }
}
