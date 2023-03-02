import "../styles/LoginForm.css"
import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { UserContext } from "../user/UserContext";
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import { LogInForm } from "../models";
import SocketContext from './context'

interface MyProps {
    action: any;
}

function LoginForm(props: MyProps) {
    let navigate = useNavigate();
    let socket = useContext(SocketContext);
    const { register, handleSubmit } = useForm<LogInForm>();
    
    const onSubmit = (data: LogInForm) => {
        accountService.login(data)
        .then(Response => {
            accountService.saveToken(Response.data.access_token);
            props.action(accountService.getToken());
            navigate("/");
        })
        .catch(error => {
            console.log(error);
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
            <a href="/signin">Not registered ? Sign In !</a>
        </form>
        </div>
    )
}

export default LoginForm;