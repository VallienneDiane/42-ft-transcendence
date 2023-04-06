import { useEffect, useState } from "react";
import { accountService } from "../services/account.service";
import { userService } from "../services/user.service";

interface userProps {
    login: string,
    avatar: string,
}

const AvatarHomeSettings = (props: userProps) => {

    const [avatar, setAvatar] = useState<string>();
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    useEffect(() => {
        userService.getUser(props.login)
            .then(response => {
                setAvatar(props.avatar);
            })
            .catch(error => {
                console.log(error);
            });
    }, [])

    const avatarSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }

    const avatarSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
            <h2>Upload a new Avatar</h2>
            <img id="profilePicture" src={avatar} />
            <form onSubmit={avatarSubmit}>
                <div id="inputDiv" className={isHovered ? "hovered" : ""} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}>
                    <p>Drop file here</p>
                    <p className="or">OR</p>
                    <input type="file" name="" id="files" accept="image/*" onChange={avatarSelected} />
                </div>
                <label htmlFor="">{selectedFile ? selectedFile.name : "No file selected..."}</label>
                <button type="submit">Upload file</button>
            </form>
        </div>
    )
}

export default AvatarHomeSettings;