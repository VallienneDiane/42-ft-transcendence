import { useEffect, useState } from "react";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { userService } from "../../services/user.service";
import { LoginSettingsForm } from "../../models";
import { useForm } from "react-hook-form";

const AvatarNameSettings: React.FC = () => {
    let decodedToken: JwtPayload = accountService.readPayload()!;
    const id = decodedToken.sub;
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [avatar, setAvatar] = useState<string>('');
    const [login, setLogin] = useState<string>('');
    const [error, setError] = useState<boolean>(false);
    const [errorAlpha, setErrorAlpha] = useState<boolean>(false);
    const [errorSize, setErrorSize] = useState<boolean>(false);
    const [uniqueLogin,setIsUniqueLogin] = useState<boolean>(true);
    const { handleSubmit } = useForm<LoginSettingsForm>({}); 

    useEffect(() => {
        userService.getUser(id!)
            .then(response => {
                setAvatar(response.data.avatarSvg);
                setLogin(response.data.login);
            })
            .catch(error => {
                console.log(error);
            });
    }, [])

    useEffect(() => {
        if(selectedFile) {
            let reader = new FileReader();
            reader.onloadend = function () {
                setAvatar(reader.result! as string);
            }
            reader.readAsDataURL(selectedFile!)
        }
    }, [selectedFile])

    const avatarSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }

    const handleDragOver = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setIsHovered(true);
    }

    const handleDragLeave = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setIsHovered(false);
    }

    const handleDrop = (event: React.DragEvent<HTMLInputElement>) => {
        setIsHovered(false);
        event.preventDefault();
        if (event.type === 'drop') {
            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
                const imgFiles = Array.from(files).filter(file => {
                    return file.type.startsWith('image/');
                })
                if (imgFiles.length > 0) {
                    setSelectedFile(imgFiles[0]);
                }
            }
        }
    }

    const loginSubmit = async () => {
        const user = {
            id: id,
            login: login,
        }
        if(login && login.length < 3) {
            setError(true);
            return;
        }
        if(!login.match(/^[a-zA-Z0-9-_]+$/)) {
            setErrorAlpha(true);
            return;
        }
        if(login.length > 15 || login.length < 4) {
            setErrorSize(true);
            return;
        }
        await accountService.isUniqueLogin(login!)
        .then(loginUnique => {
            if(loginUnique.data == true) {
                accountService.updateLogin(user)
                .catch(error => {console.log(error);});
            }
            else {
                setIsUniqueLogin(false);
            }
        })
        .catch(error => {console.log(error);});
    }

    const avatarSubmit = () => {
        const user = {
            id: id,
            avatarSvg: avatar,
        }
        accountService.updateAvatar(user)
        .catch(error => {console.log(error);});
    }

    const onChangeLogin = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLogin(event.target.value);
        setIsUniqueLogin(true);
        setError(false);
        setErrorAlpha(false);
        setErrorSize(false);
    }

    return (
        <div id="settings">
            <div id="name">
                <form onSubmit={handleSubmit(loginSubmit)}>
                    <h2>Change your login </h2>
                    <input className="form_element"
                        value={login}
                        type="text"
                        onChange={onChangeLogin}
                    />
                    <div className="saveZone">
                        <button id="save" type="submit">SAVE</button>
                        { uniqueLogin ? null : <p className="error">This login already exist</p> }
                        { errorAlpha ? <p className="error">Only alphanumeric characters & underscore allowed</p> : null}
                        { errorSize ? <p className="error">Login must be between 3 and 15 characters</p> : null}
                        { error ? <p className="error">Login must be at least 3 characters </p> : null }
                    </div>
                </form>
            </div>
            <div id="avatar">
                <form onSubmit={handleSubmit(avatarSubmit)}>
                    <div id="picture">
                        <h2>Upload a new avatar </h2>
                        <img id="profilePicture" src={avatar} />
                    </div>
                    <div id="inputDiv" className={isHovered ? "hovered" : ""} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}>
                        <p>Drop file here</p>
                        <p className="or">OR</p>
                        <input type="file" name="" id="files" accept="image/*" onChange={avatarSelected} />
                    </div>
                    <label htmlFor="">{selectedFile ? selectedFile.name : "No file selected..."}</label>
                    <div className="saveZone">
                        <button id="save" type="submit">SAVE</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AvatarNameSettings;