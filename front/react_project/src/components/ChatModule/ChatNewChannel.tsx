import { useContext, useState, useRef, useEffect } from "react";
import { SocketContext } from "../context";
import { useForm } from 'react-hook-form';
import { IChannel } from "./Chat_models";

export function Popup(props: {handleClose: any}) {
	const {socket} = useContext(SocketContext);
    const { register, formState: { errors }, setValue, handleSubmit } = useForm<IChannel>({ 
        defaultValues: { 
        name: "",
        password: false,
        channelPass: "",
        inviteOnly: false } 
    });
    const [showChannelPass, setShowChannelPass] = useState<boolean>(false);
    const [isPassword, setIsPassword] = useState<boolean>(false);
    const [isInviteOnly, setIsInviteOnly] = useState<boolean>(false);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (e: any) => {
        if (ref.current && !ref.current.contains(e.target)) {
            props.handleClose();
        }
    }

    const onKeyPress = (event: any) => {
        if (event.keyCode === 27) {
            props.handleClose();
        }
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", onKeyPress);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", onKeyPress);
        }
    }, [ref]);

    const changeStatePassword = (event: any) => {
        setShowChannelPass(event.target.checked);
        setIsPassword(event.target.checked);
        setIsInviteOnly(false);
        setValue("password", event.target.checked);
        setValue("inviteOnly", false);
    }

    const changeStateInviteOnly = (event: any) => {
        setShowChannelPass(false);
        setIsPassword(false);
        setIsInviteOnly(event.target.checked);
        setValue("password", false);
        setValue("inviteOnly", event.target.checked);
    }

    const onSubmit = (data: IChannel) => {
        let channPass: string = "";
        if (data.inviteOnly == false)
            channPass = data.channelPass!;
        socket.emit('createChannel', {
            name: data.name,
            password: data.password,
            channelPass: channPass,
            inviteOnly: data.inviteOnly
        });
        props.handleClose();
    };

    return (
      <div className="popup">
        <div className="box" ref={ref}>
            <h1>Create new channel</h1>
            <form className="formNewChannel" onSubmit={handleSubmit(onSubmit)}>
                <section>
                    <label className="labelName">Channel Name</label>
                    <input {...register("name", { required: true, minLength: 2, maxLength: 15, pattern: /^[A-Za-z0-9]+$/i })}
                    type="text"
                    placeholder=""
                    />
                </section>
                    {errors.name && <div className="logError">Invalid channel name</div>}
                <div className="rawCheckbox">
                    <section>
                        <input type="checkbox" {...register("password")} checked={isPassword} onChange={changeStatePassword}/>
                        <label className="labelName">Password</label>
                    </section>
                    <section>OR</section>
                    <section>
                        <input type="checkbox" {...register("inviteOnly")} checked={isInviteOnly} onChange={changeStateInviteOnly}/>
                        <label className="labelName">Invite Only</label>
                    </section>
                </div>
                    {showChannelPass && (
                        <input {...register("channelPass", { required: true, minLength: 2, maxLength: 20, pattern: /^[A-Za-z0-9]+$/i })}
                        type="password"
                        placeholder=""
                        />
                    )}
                    {showChannelPass && errors.channelPass && <div className="logError">Your password is not valid</div>}
                <button className="button" type="submit">Create</button>
            </form>
        </div>
      </div>
    );
};
