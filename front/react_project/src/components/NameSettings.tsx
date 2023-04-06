import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../services/account.service";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { SettingsForm } from "../models";
import { useForm } from "react-hook-form";

const userSchema = yup.object().shape({
    login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters"),
})

const NameSettings: React.FC = () => {
    const { register, handleSubmit, formState: { errors }} = useForm<SettingsForm>({
        resolver: yupResolver(userSchema)
      });

    const userLogin = async (data: SettingsForm) => {
        console.log("data nameSettings : ", data, data.login);
        accountService.updateUser(data.login);
    }

    return (
        <div id="nameSettings">
            <h2>Choose your login </h2>
            <form className="name" onSubmit={handleSubmit(userLogin)}>
                <input className="form_element" 
                    {...register("login")}
                    type="text" 
                    placeholder="Login"
                    />
                    {errors.login && <p className='errorsName'>{errors.login.message}</p>} 
                <button type="submit">Save</button>
            </form>
        </div>
    )
}

export default NameSettings;