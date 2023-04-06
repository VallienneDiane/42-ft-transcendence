import { useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/HomePageSettings.scss"
import AvatarHomeSettings from "./AvatarHomeSettings";
import NameSettings from "./NameSettings";

const HomePageSettings: React.FC = () => {

    const location = useLocation();
    const login = location.state?.login;
    const avatar = location.state?.avatar;

    console.log("avatar ", avatar, login);
    return (
        <div id="homePageSettings">
        <NameSettings />
        <AvatarHomeSettings login={login} avatar={avatar} />
        </div>
    )
}

export default HomePageSettings;