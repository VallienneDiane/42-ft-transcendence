import React, { useContext, useState } from "react";
import { useForm, Controller } from 'react-hook-form';
import { Box, Checkbox, Switch, Button } from '@mui/material';
import Input from '@mui/material/Input';
import { NewChannel, IChat, Message } from "../models";
import '../styles/ChatModule.scss'
import SocketContext from "./context";

function Popup(props: {handleClose: any}) {
	const {socket} = useContext(SocketContext);
    const { control, formState: { errors }, handleSubmit } = useForm<NewChannel>();

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

    return (
      <div className="popupBox">
        <div className="box">
          <span className="closeIcon" onClick={props.handleClose}>x</span>
            <b>Create New Channel</b>

            <Box component="form" className="formNewChannel" onSubmit={handleSubmit(onSubmit)}>
                <section>
                    <label>Channel Name</label>
                    <Controller
                        name="channelName"
                        control={control}
                        rules={{ required: true, maxLength: 20, pattern: /^[A-Za-z]+$/i }}
                        render={({ field }) => <Input {...field} />}
                        defaultValue=""
                    />
                    {errors.channelName && "Channel name is required"}
                </section>
                <section>
                    <label>Password</label>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                        <Switch
                            onChange={(e) => field.onChange(e.target.checked)}
                            checked={field.value}
                        />
                        )}
                    />
                </section>
                <section>
                    <label>Invite Only</label>
                    <Controller
                        name="inviteOnly"
                        control={control}
                        render={({ field }) => (
                        <Checkbox
                            onChange={(e) => field.onChange(e.target.checked)}
                            checked={field.value}
                        />
                        )}
                    />
                </section>
                <section>
                    <label>Persistant</label>
                    <Controller
                        name="persistant"
                        control={control}
                        render={({ field }) => (
                        <Checkbox
                            onChange={(e) => field.onChange(e.target.checked)}
                            checked={field.value}
                        />
                        )}
                    />
                </section>
                <section>
                    <label>Only OP can talk</label>
                    <Controller
                        name="onlyOpCanTalk"
                        control={control}
                        render={({ field }) => (
                        <Checkbox
                            onChange={(e) => field.onChange(e.target.checked)}
                            checked={field.value}
                        />
                        )}
                    />
                </section>
                <section>
                    <label>Hidden</label>
                    <Controller
                        name="hidden"
                        control={control}
                        render={({ field }) => (
                        <Checkbox
                            onChange={(e) => field.onChange(e.target.checked)}
                            checked={field.value}
                        />
                        )}
                    />
                </section>
                <Button type="submit">Create</Button>
            </Box>
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
