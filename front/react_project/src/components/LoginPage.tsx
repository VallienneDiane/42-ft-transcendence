import "../styles/LoginPage.scss"
import React, { useContext, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { UserContext } from "../user/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import { LogInForm } from "../models";

const LoginForm: React.FC = () => {
    let navigate = useNavigate();
    let user = useContext(UserContext);
    const { register, handleSubmit, formState: {errors}} = useForm<LogInForm>();
    const location = useLocation();
    const loginInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (loginInput.current) {
            loginInput.current.focus();
        }
    }, [])
    
    const onSubmit = (data: LogInForm) => {
        accountService.login(data)
        .then(Response => {
            accountService.saveToken(Response.data.access_token);
            const from = (location.state as any)?.from || "/";
            navigate(from);
        })
        .catch(error => {
            console.log('login error', error);
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
                    {errors.login && <span>Login is required</span>}
                    <input className="form_element"
                    {...register("password", {required: true})}
                    type="password"
                    placeholder="Enter your password ..."
                    />
                    {errors.password && <span>Password is required</span>}
                    <button className="form_element" type="submit">Submit</button>
                </form>
                <a href="/signin">Not registered ? Sign In !</a>
            </div>
        </div>
    )
}

export default LoginForm;