import "../styles/LoginPage.css"
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
            console.log(error);
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
                // ref={loginInput}
                // name="login"
                // required
                />
                {errors.login && <span>Login is required</span>}
                <input
                {...register("password", {required: true})}
                type="password"
                placeholder="Enter your password ..."
                // name="password"
                // required
                />
                {errors.password && <span>Password is required</span>}
                <button type="submit">Submit</button>
                <a href="/signin">Not registered ? Sign In !</a>
            </form>
        </div>
    )
}

export default LoginForm;