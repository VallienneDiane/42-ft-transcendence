import { useEffect, useState } from "react";
import { accountService } from "../services/account.service";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { SettingsForm } from "../models";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom"
import "../styles/HomePageSettings.scss"

const userSchema = yup.object().shape({
    login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters") ,
})

const HomePageSettings: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const id42 = location.state?.id42;
    const email = location.state?.email;
    const [avatar, setAvatar] = useState<string>(location.state?.avatar);
    const [login, setLogin] = useState<string>(location.state?.login);
    const [uniqueLogin, setIsUniqueLogin] = useState<boolean>(true);
    const [uniqueId42, setIsUniqueId42] = useState<boolean>(true);
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [errorAlpha, setErrorAlpha] = useState<boolean>(false);
    const [errorSize, setErrorSize] = useState<boolean>(false);
    const { register, handleSubmit, formState: { errors }} = useForm<SettingsForm>({
        resolver: yupResolver(userSchema)
    });

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

    useEffect(() => {
        if(id42 == undefined) {
            navigate("/");
            return;
        }    
    }, [])
    
    const userSubmit = async () => {
        const user = {
            id42: id42.toString(),
            login: login,
            email: email,
            avatarSvg: avatar,
        }
        if((login && login.length > 15) || (login && login.length < 3)) {
            setErrorSize(true);
            return;
        }
        if(!login.match(/^[a-zA-Z0-9-_]+$/)) {
            setErrorAlpha(true);
            return;
        }
        await accountService.isUniqueLogin(user.login)
        .then(loginUnique => {
            if(loginUnique.data == true) {
                accountService.isId42(user.id42)
                .then(res_id42 => {
                    if(res_id42.data == true) {
                        setIsUniqueId42(false);
                        return;
                    }
                    setIsUniqueId42(true);
                    accountService.createUser(user)
                    .then(token => {
                        accountService.saveToken(token.data.access_token);
                        const from = (location.state as any)?.from || "/";
                        navigate(from);
                    })
                    .catch(error => {console.log(error);});
                })
                .catch(error => {console.log(error);});
            }  
            else {
                setIsUniqueLogin(false);
            }
        })
        .catch(error => {console.log(error);});
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

    const onChangeLogin = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLogin(event.target.value);
        setIsUniqueLogin(true);
    }

    return (
        <div id="homePageSettings">
            <div className="card">
                <h1>Account Settings</h1>
                <form onSubmit={handleSubmit(userSubmit)}>
                    <div id="name">
                        <h2>Choose your login </h2>
                            <input className="form_element" 
                                {...register("login")}
                                value={login}
                                type="text"
                                onChange={onChangeLogin}
                            />
                    </div>
                    <div id="avatar">
                        <div id="picture">
                            <h2>Upload your avatar </h2>
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
                            {errors.login && <p className="error">{errors.login.message}</p>}
                            { uniqueLogin ? null : <p className="error">This login already exist</p> }
                            { uniqueId42 ? null : <p className="error">You are already register with 42</p> }
                            { errorAlpha ? <p className="error">Only alphanumeric characters & underscore & dash allowed</p> : null}
                            { errorSize ? <p className="error">Login must be between 3 and 15 characters</p> : null}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default HomePageSettings;