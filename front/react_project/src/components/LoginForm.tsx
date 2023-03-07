import "../styles/LoginForm.css"
import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { UserContext } from "../user/UserContext";
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import { LogInForm, VerifyCodeForm } from "../models";

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const { register, handleSubmit } = useForm<LogInForm>();
    // const [is2faActive, setActivate2fa] = useState<boolean>(false);

    const onSubmit = async (data: LogInForm) => {
        accountService.login(data)
        .then(response_user => {
            if(response_user.data == true) {
                accountService.isGoogleAuthActivated(data.login)
                .then(response_2fa => {
                    console.log(response_2fa);
                    if(response_2fa.data == true) {
                        navigate("/verifyCode2fa", { state: { login: data.login } });
                    }
                    else {
                        accountService.generateToken(data.login)
                        .then(response_token => {
                            console.log(response_token);
                            accountService.saveToken(response_token.data.access_token);
                            navigate('/');
                        })
                        .catch(error => {
                            console.log(error);
                        });
                    }
                })
            }
            
        });
    }

    
    // const onSubmit = (data: LogInForm) => {
    //     accountService.login(data)
    //     .then(Response => {
    //         accountService.saveToken(Response.data.access_token);
    //     });
    //     accountService.isGoogleAuthActivated()
    //     .then(response => {
    //         setActivate2fa(response.data.is2faActive);
    //         setVerifyCode(response.data.isCodeValid);
    //     })
    //     .catch(error => {
    //         console.log(error);
    //     });
    //     console.log("LOGINFORM : 2fa actif ? ", is2faActive, "code verified ? ", isVerified);
    //     if(is2faActive == true) {
    //         navigate("/verifyCode2fa");
    //     }
    //     if(is2faActive == false || isVerified == true)
    //         navigate("/");
    // }
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