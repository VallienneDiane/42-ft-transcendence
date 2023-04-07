import { accountService } from "../services/account.service";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";;
import { GridLoader, SyncLoader } from 'react-spinners';
import "../styles/Callback.scss"

const Callback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
        }, 5000)
    }, [])

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    useEffect(() => {
        accountService.callback(code!)
        .then(response => {
            if(response.data.newuser == true) {
                navigate("/homeSettings", { state: { login: response.data.login, avatar: response.data.avatarSvg } });
            }
            else {
                console.log("user déjà connu dans la BDD");
                accountService.is2faActive(response.data.login)
                .then(response_2fa => {
                    if(response_2fa.data.is2faActive == true) {
                        navigate("/verifyCode2fa", { state: { login: response.data.login } });
                    }
                    else {
                        accountService.generateToken(response.data.login)
                        .then(res_token => {
                            console.log(" RES TOKEN ", res_token);
                            accountService.saveToken(res_token.data.access_token);
                            const from = (location.state as any)?.from || "/";
                            navigate(from);
                        })
                    }
                })
                .catch(error => {
                    console.log(error);
                })
            }
        })
        .catch(error => {
            console.log(error);
        })
    }, [code])

    return (
        <div id="loadingPage">
            <div className="spinner">
                <p>Loading</p>
                <GridLoader size="28px" color="#36d7b7" loading={true}/>
            </div>
        </div>
    );
}

export default Callback;