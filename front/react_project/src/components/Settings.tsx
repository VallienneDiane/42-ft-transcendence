import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../services/account.service";

const Settings: React.FC = () => {
    let user: JwtPayload = accountService.readPayload();
    return (
        <div>
            <h1>Settings Page of {user.login} </h1>

            <button className="enableTwoFactor" type="button">
                    Activate Google Authentificator
            </button>
        </div>
    )
}

export default Settings;