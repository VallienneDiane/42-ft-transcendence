import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { NewChannel, IChat, Message } from "../models";
import '../styles/ChatModule.scss'
import SocketContext from "./context";
import { Socket } from 'socket.io-client'
import Checkbox from '@mui/material/Checkbox';

function Popup(props: {handleClose: any}) {
	const {socket} = React.useContext(SocketContext);
    const { register, handleSubmit } = useForm<NewChannel>();
    const [checked, setChecked] = React.useState(false);

    const onSubmit = (data: NewChannel) => {
        socket.emit('createChannel', {
            channelName: data.channelName,
            channelPass: data.channelPass,
            inviteOnly: data.inviteOnly,
            persistant: data.persistant,
            onlyOpCanTalk: data.onlyOpCanTalk,
            hidden: data.hidden,
        });
    };

    const handleChange = () => {
        setChecked(!checked);
    }

    return (
      <div className="popupBox">
        <div className="box">
          <span className="closeIcon" onClick={props.handleClose}>x</span>
            <b>Create New Channel</b>
            <form onSubmit={handleSubmit(onSubmit)}>
                <label>Channel Name</label>
                <input
                {...register("channelName", {
                    required: true,
                    maxLength: 20,
                    pattern: /^[A-Za-z]+$/i
                  })} />
                  <label>
                      Invite Only
                  <input 
                    type="checkbox" 
                    checked={checked}
                    onChange={handleChange}
                    />
                  </label>
            <input type="submit"/>
            </form>
        </div>
      </div>
    );
  };
  
  class Search extends React.Component<IChat, Message> {
      constructor(props: {}) {
          super(props);
          this.state = { text: "" };
          this.searchSmth = this.searchSmth.bind(this);
          this.handleMessage = this.handleMessage.bind(this);
      }
  
      searchSmth(event: any) {
          event.preventDefault();
          if (this.state.text.length > 0) {
              this.props.socket!.emit('createChannel', {channelName: this.state.text, channelPass: undefined, inviteOnly: false, persistant: false, onlyOpCanTalk: false, hidden: false});
          }
          this.setState({ text: "" });
      }
  
      handleMessage(event: React.ChangeEvent<HTMLInputElement>) {
          this.setState({ text: event.target.value });
      }
  
      render() {
          const text: string = this.state.text;
          return (
              <div>
                  <form className="chatSearchHeader" onSubmit={this.searchSmth}>
                      <i className="fa fa-search" aria-hidden="true"></i>
                      <input type="textarea" className="searchBar" placeholder="Search" value={text} onChange={this.handleMessage} />
                      <input type="submit" className="searchButton" value="👆" />
                  </form>
              </div>
          )
      }
  }

export default function CreateChannel() {
    const [btnState, setBtnState] = useState<boolean>(false);

    const handleBtnClick = () => {
        setBtnState(!btnState);
    };

    return (
        <div className="createChannel">
            <p className="btn" onClick={() => handleBtnClick()}>+</p>
            {btnState && <Popup
                handleClose={handleBtnClick}
            />}       
        </div>
    );
}
