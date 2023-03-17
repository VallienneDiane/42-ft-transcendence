import React, { useContext, useState, useRef, useEffect, useCallback } from "react";
import { useForm, Controller } from 'react-hook-form';
import { Box, Checkbox, Switch, Button } from '@mui/material';
import Input from '@mui/material/Input';
import { IChannel, IChat, Message } from "../models";
import '../styles/ChatModule.scss'
import SocketContext from "./context";

function Popup(props: {handleClose: any}) {
	const {socket} = useContext(SocketContext);
    const { control, formState: { errors }, handleSubmit } = useForm<IChannel>({ 
        defaultValues: { 
            channelName: "",
            password: false,
            channelPass: "",
            inviteOnly: false,
            persistant: false,
            onlyOpCanTalk: false, 
            hidden: false } 
        });
    const [showChannelPass, setShowChannelPass] = useState<boolean>(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (ref.current && !ref.current.contains(e.target)) {
                props.handleClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [ref]);

    const onSubmit = (data: IChannel) => {
        socket.emit('createChannel', {
            channelName: data.channelName,
            password: data.password,
            channelPass: data.channelPass,
            inviteOnly: data.inviteOnly,
            persistant: data.persistant,
            onlyOpCanTalk: data.onlyOpCanTalk,
            hidden: data.hidden,
        });
        props.handleClose();
    };

    return (
      <div className="popupBox">
        <div className="box" ref={ref}>
          <span className="closeIcon" onClick={props.handleClose}>x</span>
            <h1>Create New Channel</h1>

            <Box component="form" className="formNewChannel" onSubmit={handleSubmit(onSubmit)}>
                <section className="sectionTest">
                    <label className="labelName">Channel Name</label>
                    <Controller
                        name="channelName"
                        control={control}
                        rules={{ required: true, minLength: 2, maxLength: 20, pattern: /^[A-Za-z0-9]+$/i }}
                        render={({ field }) => <Input {...field} />}
                        defaultValue=""
                    />
                    {errors.channelName && "Channel name is required"}
                </section>
                <section className="sectionTest">
                    <label className="labelName">Password</label>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                        <Switch
                            onChange={(e) => {
                                field.onChange(e.target.checked);
                                setShowChannelPass(e.target.checked);
                            }}
                            checked={field.value}
                        />
                        )}
                    />
                    {showChannelPass && (
                        <Controller
                        name="channelPass"
                        control={control}
                        rules={{ required: true, maxLength: 20, pattern: /^[A-Za-z]+$/i }}
                        render={({ field }) => <Input {...field} type="password"/>}
                        defaultValue=""
                    />
                    )}
                    {showChannelPass && errors.channelPass && "Your password is not valid"}
                </section>
                <div className="rawCheckbox">
                <section className="sectionTest">
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
                    <label className="labelName">Invite Only</label>
                </section>
                <section className="sectionTest">
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
                    <label className="labelName">Persistant</label>
                </section>
                </div>
                <div className="rawCheckbox">
                <section className="sectionTest">
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
                    <label className="labelName">Only OP can talk</label>
                </section>
                <section className="sectionTest">
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
                    <label className="labelName">Hidden</label>
                </section>
                </div>
                <Button type="submit">Create</Button>
            </Box>
        </div>
      </div>
    );
};
  
export default function CreateChannel() {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const handleBtnClick = () => {
        setIsOpen((prevSate) => !prevSate);
    };

    return (
        <div className="createChannel">
            <p className="btn" onClick={handleBtnClick}>+</p>
            {isOpen && <Popup
                handleClose={handleBtnClick}
            />}       
        </div>
    );
}
