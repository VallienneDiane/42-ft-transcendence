
import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import NavBar from "./Navbar";
import { UserContext } from "../user/UserContext";
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import LogInForm from "../models";

const LoginForm: React.FC = () => {
    let navigate = useNavigate();
    let user = useContext(UserContext);
    const { register, handleSubmit } = useForm<LogInForm>();
    
    const onSubmit = (data: LogInForm) => {
        accountService.login(data)
        .then(Response => {
            // accountService.logout(Response.data.access_token);
            accountService.saveToken("temporarytokenthatitypedmyself18930890246c2e0ce6zcz1rce61");
            user.login = Response.data.login;
            user.email = Response.data.email;
            navigate("/");
        })
        .catch(error => {
            console.log(error);
        });
    }
    
    return (
        <div >
            <NavBar/>
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