import { accountService } from "../services/account.service";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { GridLoader, SyncLoader } from 'react-spinners';
import "../styles/Callback.scss"

const Callback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    let newUser:boolean = true;

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
        }, 5000)
    }, [])

    useEffect(() => {
        let ids42: {id42: number}[];
        accountService.getAllIds42()
        .then(res => {
            ids42 = res.data;
        })
        .catch(error => {});

        accountService.callback(code!)
        .then(res => {
            for(let i = 0; i < ids42.length; i++) {
                if(res.data.id42 == ids42[i].id42) {
                    newUser = false;
                }
            }
            if(newUser == true) {
                navigate("/homeSettings", { state: { id42: res.data.id42, login: res.data.login, avatar: res.data.avatarSvg, email: res.data.email } });
                return;
            }
            accountService.is2faActive42(res.data.id42)
            .then(response_2fa => {
                if(response_2fa.data.is2faActive == true) {
                    navigate("/verifyCode2fa", { state: { id42: res.data.id42 } });
                }
                else {
                    accountService.generateToken42(res.data.id42)
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