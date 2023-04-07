import { useContext, useState, useRef, useEffect } from "react";
import SocketContext from "../context";
import { useForm } from 'react-hook-form';
import { IChannel } from "../../models";

function Popup(props: {handleClose: any}) {
	const {socket} = useContext(SocketContext);
    const { register, formState: { errors }, handleSubmit } = useForm<IChannel>({ 
        defaultValues: { 
        name: "",
        password: false,
        channelPass: "",
        inviteOnly: false,
        hidden: false } 
    });
    const [showChannelPass, setShowChannelPass] = useState<boolean>(false);
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

    const changeState = (event: any) => {
        setShowChannelPass(event.target.checked);
    }

    const onSubmit = (data: IChannel) => {
        console.log(data)
        socket.emit('createChannel', {
            name: data.name,
            password: data.password,
            channelPass: data.channelPass,
            inviteOnly: data.inviteOnly,
            hidden: data.hidden,
        });
        props.handleClose();
    };

    return (
      <div className="popup">
        <div className="box" ref={ref}>
            <h1>Create New Channel</h1>
            <form className="formNewChannel" onSubmit={handleSubmit(onSubmit)}>
                <section>
                    <label className="labelName">Channel Name</label>
                    <input {...register("name", { required: true, minLength: 2, maxLength: 20, pattern: /^[A-Za-z0-9]+$/i })}
                    type="text"
                    placeholder=""
                    />
                    {errors.name && <div className="logError">Channel name is required</div>}
                </section>
                <section>
                    <label className="labelName">Password</label>
                    <input type="checkbox" {...register("password")} onChange={changeState}/>
                    {showChannelPass && (
                        <input {...register("channelPass", { required: true, minLength: 2, maxLength: 20, pattern: /^[A-Za-z0-9]+$/i })}
                        type="password"
                        placeholder=""
                        />
                    )}
                    {showChannelPass && errors.channelPass && <div className="logError">Your password is not valid</div>}
                </section>
                <div className="rawCheckbox">
                    <section>
                        <input type="checkbox" {...register("inviteOnly")}/>
                        <label className="labelName">Invite Only</label>
                    </section>
                </div>
                <div className="rawCheckbox">
                    <section>
                        <input type="checkbox" {...register("hidden")}/>
                        <label className="labelName">Hidden</label>
                    </section>
                </div>
                <button className="button" type="submit">Create</button>
            </form>
        </div>
      </div>
    );
};

export function CreateChannel() {
    const [popupIsOpen, setPopupIsOpen] = useState<boolean>(false);

    const onClickPopup = () => {
        setPopupIsOpen(!popupIsOpen);
    }

    return (
        <div id="createChannel">
            {popupIsOpen && <Popup handleClose={onClickPopup} />}
            <p className="btn" onClick={onClickPopup}>Create new channel</p>    
        </div>
    );
}
