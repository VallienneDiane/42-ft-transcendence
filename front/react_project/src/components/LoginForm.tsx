import "../styles/LoginForm.css"
import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { UserContext } from "../user/UserContext";
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import { LogInForm } from "../models";

const LoginForm: React.FC = () => {
    let navigate = useNavigate();
    let user = useContext(UserContext);
    const { register, handleSubmit } = useForm<LogInForm>();
    const [isVerified, setVerifyCode] = useState<boolean>(false);
    const [is2faActive, setActivate2fa] = useState<boolean>(false);

    const onSubmit = (data: LogInForm) => {
        accountService.login(data)
        .then(Response => {
            accountService.saveToken(Response.data.access_token);
            accountService.isGoogleAuthActivated()
            .then(response => {
                setActivate2fa(response.data.isActive);
                setVerifyCode(response.data.isCodeValid);
                if(is2faActive == true) {
                    console.log("LOGIN, 2fa actif ", response.data.isActive);
                    navigate("/verifyCode2fa");
                }
                navigate("/");
            })
            .catch(error => {
                console.log(error);
            });
        });
    }
    
    return (
        <div >
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
            <button type="submit">Submit</button>
            <a href="/signup">Not registered ? Sign Up !</a>
        </form>
        </div>
    )
}

export default LoginForm;