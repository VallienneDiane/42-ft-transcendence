import { accountService } from "../services/account.service";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { GridLoader, SyncLoader } from 'react-spinners';
import "../styles/Callback.scss"
import { userService } from "../services/user.service";

const Callback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
        }, 5000)
    }, [])

    useEffect(() => {
        accountService.callback(code!)
        .then(res_user => {
            accountService.isId42(res_user.data.id42)
            .then(res_id42 => {
                if(res_id42.data == false && accountService.isLogged() == false) {
                    navigate("/homeSettings", 
                    { state: 
                        { 
                            id42: res_user.data.id42, 
                            login: res_user.data.login, 
                            avatar: res_user.data.avatarSvg, 
                            email: res_user.data.email 
                        } 
                    });
                    return;
                }
                accountService.is2faActive42(res_user.data.id42)
                .then(res_2fa => {
                    if(res_2fa.data.is2faActive == true) {
                        navigate("/verifyCode2fa", { state: { id42: res_user.data.id42 } });
                    }
                    else {
                        accountService.generateToken42(res_user.data.id42)
                        .then(res_token => {
                            accountService.saveToken(res_token.data.access_token);
                            const from = (location.state as any)?.from || "/";
                            navigate(from);
                        })
                    }
                })
                .catch(error => {console.log(error);})
            })
            .catch(error => {console.log(error);})
        })
        .catch(error => {console.log(error);})
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