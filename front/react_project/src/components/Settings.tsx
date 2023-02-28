import { useState } from "react";
import { accountService } from "../services/account.service";
import "../styles/Settings.css"

// a refaire avec une classe
const Settings: React.FC = () => {

    const [qrcode, setQrcode] = useState<string>("");
    const [stateTwoFactor, setStateTwoFactor] = useState<string>("");

    const toggle2fa = () => {
        stateTwoFactor === "disable" ? setStateTwoFactor("enable") : setStateTwoFactor("disable");
        accountService.enableTwoFactorAuth().then(response => {
            setQrcode(response.data.qrcode);
        })
        .catch(error => console.log(error));
    }

    if(stateTwoFactor == "disable") {
        return (
            <div id="settings">
                <h1>Settings Page </h1>
                <button className={"toggle2fa " + (stateTwoFactor)} type="button" onClick={toggle2fa}>
                        Desactivate Google Authentificator
                </button>
                <p>Scan the QRCode in your Google Authentificator Application : </p>
                <img id="qrcode" src={qrcode} alt="" />
                <input type="text" placeholder="Enter the code"></input>
            </div>)
    }
    return (
        <div id="settings">
            <h1>Settings Page </h1>
            <button className={"toggle2fa " + (stateTwoFactor)} type="button" onClick={toggle2fa}>
                   Activate Google Authentificator
            </button>
        </div>
    )
}

export default Settings;