import { accountService } from "../services/account.service";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";;
import { GridLoader, SyncLoader } from 'react-spinners';
import "../styles/Callback.scss"

const Callback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [ids42, setIds42] = useState<{id42: number}[]>([]);

    useEffect(() => {
        accountService.getAllIds42()
        .then(res => {
            setIds42(res.data);
        })
        .catch(error => {});
    }, [])

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
        .then(res => {
            for(let i = 0; i < ids42.length; i++) {
                console.log("i ", i, "ids 42 ", ids42.length, ids42[i]);
                if(res.data.id == ids42[i].id42) {
                    navigate("/homeSettings", { state: { id42: res.data.id, login: res.data.login, avatar: res.data.avatarSvg, email: res.data.email } });
                    return;
                }
            }
            console.log("user déjà connu dans la BDD", res.data);
            accountService.is2faActive(res.data.id42)
            .then(response_2fa => {
                if(response_2fa.data.is2faActive == true) {
                    navigate("/verifyCode2fa", { state: { login: res.data.login } });
                }
                else {
                    accountService.generateToken(res.data.login)
                    .then(res_token => {
                        accountService.saveToken(res_token.data.access_token);
                        const from = (location.state as any)?.from || "/";
                        navigate(from);
                    })
                }
            })
            .catch(error => {
                console.log(error);
            })
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