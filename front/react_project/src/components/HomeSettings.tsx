import { useState } from "react";
import { accountService } from "../services/account.service";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { SettingsForm } from "../models";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom"

const userSchema = yup.object().shape({
    login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters") ,
})

const HomeSettings: React.FC = () => {
    const location = useLocation();
    const login = location.state?.login;
    const avatardb = location.state?.avatar;

    const [avatar, setAvatar] = useState<string>(avatardb);
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const { register, handleSubmit, formState: { errors }} = useForm<SettingsForm>({
        resolver: yupResolver(userSchema)
    });
    
    const avatarSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }

    const avatarSubmit = (event: React.FormEvent<HTMLFormElement>, data: SettingsForm) => {
        console.log("data.login ? ", data.login);
        accountService.updateUser(data.login);
        event.preventDefault();
        let reader = new FileReader();
        reader.onloadend = function () {
            accountService.uploadAvatar(reader.result! as string)
                .then(response => {
                    console.log(response);
                    setAvatar(reader.result! as string);
                    setSelectedFile(null)
                })
                .catch(error => {
                    console.log(error);
                });
        }
        reader.readAsDataURL(selectedFile!)
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

    return (
        <div id="avatarSetting">
            <h2>Choose your login </h2>
            <form onSubmit={avatarSubmit}>
                <input className="form_element" 
                    {...register("login")}
                    // value={props.login}
                    type="text" 
                    placeholder={login}
                />
                {errors.login && <p className='errorsName'>{errors.login.message}</p>} 
                <h2>Upload a new Avatar</h2>
                <img id="profilePicture" src={avatar} />
                <div id="inputDiv" className={isHovered ? "hovered" : ""} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}>
                    <p>Drop file here</p>
                    <p className="or">OR</p>
                    <input type="file" name="" id="files" accept="image/*" onChange={avatarSelected} />
                </div>
                <label htmlFor="">{selectedFile ? selectedFile.name : "No file selected..."}</label>
                <button type="submit">Save</button>
            </form>
        </div>
    )
}

export default HomeSettings;