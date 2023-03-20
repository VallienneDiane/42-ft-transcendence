import "../styles/LoginPage.css"
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { UserContext } from "../user/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import { LogInForm } from "../models";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, handleSubmit } = useForm<LogInForm>();
    // const location = useLocation();
    // const [ incorrectCredentials, setIncorrectCredentials ] = useState<boolean>(false);

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
                            // const from = (location.state as any)?.from || "/";
                            // navigate(from);
                            navigate('/');
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
            // setIncorrectCredentials(true);
        });

    }
    return (
        <div id="login_page">
            <h1>Login page</h1>
            <form className="login" onSubmit={handleSubmit(onSubmit)}> 
            <input
            {...register("login", {required: true})}
            type="text"
            placeholder="Enter your login ..."
            // name="login"
            // required
            />
            <input
            {...register("password", {required: true})}
            type="password"
            placeholder="Enter your password ..."
            // name="password"
            // required
            />
            <button id="submit" type="submit">Submit</button>
            {/* {incorrectCredentials && (
                <div className="error">Login or Password incorrect</div>
            )} */}
            <button id="signin42"><a  href="/login42">Sign in with 42 !</a></button>
            <a href="/signup">Not registered ? Sign Up !</a>
        </form>
        </div>
    )
}

export default LoginPage;