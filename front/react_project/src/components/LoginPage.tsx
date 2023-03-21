import "../styles/LoginPage.scss"
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { UserContext } from "../user/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import { LogInForm } from "../models";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, handleSubmit } = useForm<LogInForm>();
    const location = useLocation();
    const [ incorrectCredentials, setIncorrectCredentials ] = useState<boolean>(false);

    const loginInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (loginInput.current) {
            loginInput.current.focus();
        }
    }, [])

    const onSubmit = async (data: LogInForm) => {
        accountService.login(data)
        .then(response_user => {
            if(response_user.data == true) {
                accountService.is2faActive(data.login)
                .then(response_2fa => {
                    console.log(response_2fa);
                    if(response_2fa.data.is2faActive == true) {
                        navigate("/verifyCode2fa", { state: { login: data.login } });
                    }
                    else {
                        accountService.generateToken(data.login)
                        .then(response_token => {
                            console.log(response_token);
                            accountService.saveToken(response_token.data.access_token);
                            const from = (location.state as any)?.from || "/";
                            navigate(from);
                        })
                        .catch(error => {
                            console.log(error);
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
            setIncorrectCredentials(true);
        });

    }
    return (
        <div id="login_page">
            <div className="card">
                <h1>Login page</h1>
                <form className="login" onSubmit={handleSubmit(onSubmit)}> 
                    <input className="form_element"
                    {...register("login", {required: true})}
                    type="text"
                    placeholder="Enter your login ..."
                    />
                    {/* {errors.login && <span>Login is required</span>} */}
                    <input className="form_element"
                    {...register("password", {required: true})}
                    type="password"
                    placeholder="Enter your password ..."
                    />
                    {/* {errors.password && <span>Password is required</span>} */}
                    { incorrectCredentials && <div className="logError">Wrong user or password</div>}
                    <button className="form_element" type="submit">Submit</button>
                </form>
                <button id="signin42">
                    <a href="https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-1a615688dd073d243be0d59bf7ff2953367300048cd88c855c08d4f2dd0efe4c&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2F&response_type=code">
                    Sign in with 42 ! </a>
                </button>
                <a href="/signup">Not registered ? Sign In !</a>
            </div>
        </div>
    )
}

export default LoginPage;