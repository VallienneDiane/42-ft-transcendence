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
  .number()
  .typeError('Code must be a number')
  .test('len', 'Code must be 6 characters', val => val?.toString().length === 6)
});

function Settings() {
  const [checked, setChecked] = useState(false); //si google auth actif ou non
  const [qrcode, setQrcode] = useState<string>("null");
  const [isCodeValid, setCodeBool] = useState(false); //verify code entered
  const [statusAuth, setStatus] = useState(false); //connected or not to google auth
  const {register, handleSubmit, formState: {errors}} = useForm<SettingsForm>({
    resolver: yupResolver(schema)
  });
  
    //check if google auth is already active
    const isGoogleActive = () => {
      accountService.isGoogleAuthActivated()
      .then(response => {
        setStatus(response.data);
        setChecked(response.data);
      })
      .catch(error => console.log(error));
    }
  
    useEffect(() => {
      isGoogleActive();
    }, [])
  
  //toggle switch button active or not
  const handleChange = (valueSwitch: any) => {
    setChecked(valueSwitch);
    if(valueSwitch == true) {
      accountService.enableTwoFactorAuth()
      .then(response => {
        setQrcode(response.data.qrcode);
      })
      .catch(error => console.log(error));
    }
    else if(valueSwitch == false) {
      accountService.disableTwoFactorAuth();
    }
  }
  
  //check code entered by the user
  const verifySubmittedCode = (data: SettingsForm) => {
    schema.validate(data);
    accountService.verifyCodeTwoFactorAuth(data)
    .then(response => {
        setCodeBool(response.data);
    })
    .catch(error => console.log(error));
  }

  if(checked == true && statusAuth == false) {
    return (
      <div className="toggle2fa">
          <p>Scan the QRCode in your application </p>
          <img id="qrcode" src={qrcode} alt="" />
          <form onSubmit={handleSubmit(verifySubmittedCode)}>
            <input type="text" {...register("code")} name="code" placeholder="Enter the code"/>
            {errors.code && <p className="errorsCode">{errors.code.message}</p>}
            <button type="submit">Submit</button>
          </form>
      </div>
    )
  }
  return (
    <div className="toggle2fa">
      <div className="switch">
        <p>Activate Google Authentificator</p>
        <ReactSwitch
          checked={checked}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}

export default Settings;