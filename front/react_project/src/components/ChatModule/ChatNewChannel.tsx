import { useContext, useState, useRef, useEffect } from "react";
import SocketContext from "../context";
import { useForm, Controller } from 'react-hook-form';
import { IChannel } from "../../models";
import { Box, Checkbox, Switch } from '@mui/material';
import Input from '@mui/material/Input';

export function Popup(props: {handleClose: any}) {
	const {socket} = useContext(SocketContext);
    const { control, formState: { errors }, handleSubmit } = useForm<IChannel>({ 
        defaultValues: { 
            name: "",
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
            name: data.name,
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
      <div id="popup">
        <div className="box" ref={ref}>
          <span className="closeIcon" onClick={props.handleClose}>x</span>
            <h1>Create New Channel</h1>

            <Box component="form" className="formNewChannel" onSubmit={handleSubmit(onSubmit)}>
                <section className="sectionTest">
                    <label className="labelName">Channel Name</label>
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: true, minLength: 2, maxLength: 20, pattern: /^[A-Za-z0-9]+$/i }}
                        render={({ field }) => <Input {...field} />}
                        defaultValue=""
                    />
                    {errors.name && "Channel name is required"}
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
                <button className="button" type="submit">Create</button>
            </Box>
        </div>
      </div>
    );
};
  
export function CreateChannel(props: {onClick: any}) {

    return (
        <div id="createChannel">
            <p className="btn" onClick={props.onClick}>Create new channel</p>    
        </div>
    );
}
