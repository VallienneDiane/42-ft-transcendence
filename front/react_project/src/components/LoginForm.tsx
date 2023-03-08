import "../styles/LoginForm.css"
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import { LogInForm } from "../models";

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const { register, handleSubmit } = useForm<LogInForm>();

    const onSubmit = async (data: LogInForm) => {
        accountService.login(data)
        .then(response_user => {
            if(response_user.data == true) {
                accountService.isGoogleAuthActivated(data.login)
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