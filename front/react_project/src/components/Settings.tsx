import { accountService } from "../services/account.service";

const Settings: React.FC = () => {

    return (
        <div>
            <h1>Settings Page </h1>

            <button className="enableTwoFactor" type="button" onClick={accountService.toggleTwoFactorAuth}>
                    Activate Google Authentificator
            </button>
        </div>
    )
}

export default Settings;