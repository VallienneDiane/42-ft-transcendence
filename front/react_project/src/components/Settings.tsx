import "../styles/Settings.scss"
import * as yup from 'yup';
import { VerifyCodeForm } from "../models";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { yupResolver } from '@hookform/resolvers/yup';
import ReactSwitch from 'react-switch';
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../models";
import { userService } from "../services/user.service";


const schema = yup.object().shape({
  code: yup
  .string()
  .typeError('Code must be a number')
  .test('len', 'Code must be 6 characters', val => val?.length === 6)
});

export default function Settings() {

  let decodedToken: JwtPayload = accountService.readPayload()!;
  const [checked, setchecked] = useState<boolean>(false);
  const [qrcode, setQrcode] = useState<string>("null");
  const [is2faActive, setActivate2fa] = useState<boolean>(false);
  const [user, setUser] = useState<User>();
  const [avatar, setAvatar] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<Blob | null>(null);

  const {register, handleSubmit, formState: {errors}} = useForm<VerifyCodeForm>({
    resolver: yupResolver(schema)
  });

  // console.log("SETTINGS PARAMS 1 : checked ", checked, "is2faactive ", is2faActive, " & qrcode", qrcode);
  const isGoogleActivate = () => {
    accountService.is2faActiveSettings(decodedToken.login)
    .then(response => {
      setActivate2fa(response.data.is2faActive);
      setchecked(response.data.is2faActive);
      setQrcode(response.data.qrcode);
    })
    .catch(error => console.log(error));
  }
  
  useEffect(() => {
    isGoogleActivate();
    userService.getUser(decodedToken.login)
    .then(response => {
        setUser(response.data);
        setAvatar(response.data.avatarSvg);
    })
    .catch(error => {
        console.log(error);
    });
    console.log("user", user);
  }, [])
  
  // console.log("SETTINGS PARAMS 2: checked ", checked, "is2faactive ", is2faActive, " & qrcode", qrcode);
  const verifySubmittedCode = (data: VerifyCodeForm) => {
    schema.validate(data);
    accountService.verifyCode2faSettings(data)
    .then(response => {;
      setActivate2fa(response.data.is2faActive);
    })
    .catch(error => console.log(error));
  }

  const avatarSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    // console.log(event.target.files);
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }

  const avatarSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // console.log("selectedfile", selectedFile);
    let reader = new FileReader();
    reader.onloadend = function() {
      // console.log('result', reader);
      // console.log('before reqest');
      accountService.uploadAvatar(reader.result! as string)
      .then(response => {
        console.log(response);
        setAvatar(reader.result! as string);
      })
      .catch(error => {
        console.log(error);
      });
    }
    reader.readAsDataURL(selectedFile!)
  }
  
  const handleChange = (value: boolean) => {
    setchecked(!checked);
    if(value == true) {
      accountService.enable2fa()
      .then(response => {
        setQrcode(response.data.qrcode);
      })
      .catch(error => console.log(error));
    }
    if (value == false) {
      accountService.disable2fa()
      .then(response => {
        setActivate2fa(response.data.is2faActive);
      })
      .catch(error => console.log(error));
    }
  }

  // if(checked == true && (is2faActive == false || is2faActive == null))
  return (
    <div id="settingsPage">
      <div id="avatarSetting">
        <h2>Avatar settings</h2>
        <img id="profilePicture" src={avatar} />
        <form onSubmit={avatarSubmit}>
          <input type="file" name="" id="" accept="image/*" onChange={avatarSelected}/>
          <button type="submit">Upload your new avatar</button>
        </form>
      </div>
      <div id="fasetting">
        <h2>LogIn settings</h2>
        <div className="switch">
          <p>Activate Google Authentificator</p>
          <ReactSwitch
            className="checkBox"
            checked={checked}
            onChange={handleChange}
          />
        </div>
          {checked === true ? <img id="qrcode" src={qrcode} alt="" /> : null}
          {checked === true && (is2faActive == false || is2faActive == null) ? 
          <div>
            <p>Scan the QRCode in your application </p>
            <form onSubmit={handleSubmit(verifySubmittedCode)}>
              <input type="text" {...register("code")} name="code" placeholder="Enter the code"/>
              {errors.code && <p className="errorsCode">{errors.code.message}</p>}
              <button type="submit">Submit</button>
            </form>
          </div> : null}
        {checked === true && is2faActive == true ? <p id="AuthActivate">Google Authentificator is activate</p> : null} 
      </div>
    </div>
  )
}