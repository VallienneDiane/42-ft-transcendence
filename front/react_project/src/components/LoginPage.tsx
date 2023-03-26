import "../styles/LoginPage.scss"
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import { LogInForm } from "../models";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { register, handleSubmit } = useForm<LogInForm>();
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

    const redirectToApi42 = async () => {
        console.log("redirect to api after click");
        await accountService.url42()
        .then(response_url => {
            console.log("window locatin avec url : ", response_url.data);
            window.location.href = (response_url.data);
        })
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
                <button id="signin42" onClick={redirectToApi42}>
                    Sign in with 42 !
                </button>
                <a href="/signup">Not registered ? Sign In !</a>
            </div>
        </div>
    )
}

export default LoginPage;