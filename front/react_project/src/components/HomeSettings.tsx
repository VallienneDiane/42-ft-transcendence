import { useEffect, useState } from "react";
import { accountService } from "../services/account.service";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { SettingsForm } from "../models";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom"
import "../styles/HomeSettings.scss"

const userSchema = yup.object().shape({
    login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters") ,
})

const HomeSettings: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const id42 = location.state?.id42;
    const email = location.state?.email;
    const [avatar, setAvatar] = useState<string>(location.state?.avatar);
    const [login, setLogin] = useState<string>(location.state?.login);
    const [logins, setLogins] = useState<{login: string}[]>([]);
    const [duplicateLogin, setDupLogin] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const { register, handleSubmit, formState: { errors }} = useForm<SettingsForm>({
        resolver: yupResolver(userSchema)
    });

    useEffect(() => {
        accountService.getAllLogins()
        .then(res => {
            setLogins(res.data);
        })
        .catch(error => {});
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

    const userSubmit = async () => {
        const user = {
            id42: id42,
            login: login,
            email: email,
            avatarSvg: avatar,
        }
        for(let i = 0; i < logins.length; i++) {
            if(user.login == logins[i].login) {
                setDupLogin(true);
                return;
            }
        }
        await accountService.createUser(user)
        .then(res_token => {
            accountService.saveToken(res_token.data.access_token);
            const from = (location.state as any)?.from || "/";
            navigate(from);
        })
        .catch(error => {});
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
                    console.log(selectedFile);
                }
            }
        }
    }

    const onChangeLogin = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLogin(event.target.value);
        setDupLogin(false);
    }

    return (
        <div id="homeSettings">
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
                    <div id="test">
                        <button id="save" type="submit">SAVE</button>
                        {errors.login && <p className="error">{errors.login.message}</p>}
                        { duplicateLogin ? <p className="error">This login already exist</p> : null }
                    </div>
                </div>
            </form>
        </div>
    )
}

export default HomeSettings;