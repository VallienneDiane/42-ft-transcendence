import * as yup from 'yup';
import "../styles/Settings.scss"
import { useEffect, useState } from "react";
import ReactSwitch from 'react-switch';
import { SettingsForm } from "../models";
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import { accountService } from "../services/account.service";

const schema = yup.object().shape({
  code: yup
  .string()
  .typeError('Code must be a number')
  .test('len', 'Code must be 6 characters', val => val?.length === 6)
});

function Settings() {
  const [checked, setchecked] = useState<boolean>(false); //si auth check or not
  const [qrcode, setQrcode] = useState<string>("null");
  const [isConnected, setConnexion] = useState<boolean>(false); //connected or not to google auth
  const {register, handleSubmit, formState: {errors}} = useForm<SettingsForm>({
    resolver: yupResolver(schema)
  });

    //request GET to check if google auth is activated
    const isGoogleActivate = () => {
      accountService.isGoogleAuthActivated()
      .then()
      .catch(error => console.log(error));
    }
    
    useEffect(() => {
      isGoogleActivate();
    }, [])
    
    //if user activate auth, qrcode is generate, else two factor auth is disable
    const handleChange = (value: boolean) => {
      setchecked(!checked);
      if(value == true && isConnected == false) {
        accountService.enableTwoFactorAuth()
        .then(response => {
          setQrcode(response.data.qrcode);
        })
        .catch(error => console.log(error));
      }
      else if (value == false) {
        accountService.disableTwoFactorAuth()
        .then()
        .catch(error => console.log(error));
      }
    }
  
  //check code entered by the user
  const verifySubmittedCode = (data: SettingsForm) => {
    schema.validate(data);
    accountService.verifyCodeTwoFactorAuth(data)
    .then(response => {
      setConnexion(response.data);
      console.log("isconnected : ", isConnected, "response data :" , response.data)
    })
    .catch(error => console.log(error));
  }

  // if(checked == true && isConnected == false)
  return (
    <div className="toggle2fa">
      <div className="switch">
        <p>Activate Google Authentificator</p>
        <ReactSwitch
          checked={checked}
          onChange={handleChange}
        />
      </div>
      <p>coucou + {{isConnected} ? 'true' : 'false'}</p>
      <p>Scan the QRCode in your application </p>
      <img id="qrcode" src={qrcode} alt="" />
      <form onSubmit={handleSubmit(verifySubmittedCode)}>
        <input type="text" {...register("code")} name="code" placeholder="Enter the code"/>
        {errors.code && <p className="errorsCode">{errors.code.message}</p>}
        <button type="submit">Submit</button>
      </form>
    </div>
  )
//   if (checked == true && isConnected == true)
//   return (
//     <div className="toggle2fa">
//       <div className="switch">
//         <p>Activate Google Authentificator</p>
//         <ReactSwitch
//           checked={checked}
//           onChange={handleChange}
//         />
//       </div>
//       <p>Google Authentificator is activate</p>
//       <img id="qrcode" src={qrcode} alt="" />
//     </div>
//   )
//   return (
//     <div className="toggle2fa">
//       <div className="switch">
//         <p>Activate Google Authentificator</p>
//         <ReactSwitch
//           checked={checked}
//           onChange={handleChange}
//         />
//       </div>
//     </div>
//   )
}

export default Settings;