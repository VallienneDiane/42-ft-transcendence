import { useState } from "react";
import { accountService } from "../services/account.service";
import "../styles/ToggleSwitch.scss"
import ReactSwitch from 'react-switch';
import { useForm } from "react-hook-form";
import { ToggleSwitchForm } from "../models";

function ToggleSwitch() {
  const [checked, setChecked] = useState(false);
  const [qrcode, setQrcode] = useState<string>("");
  const {handleSubmit} = useForm<ToggleSwitchForm>();

  const handleChange = (val: any) => {
    setChecked(val)
    if(val == true) {
      accountService.enableTwoFactorAuth().then(response => {
          setQrcode(response.data.qrcode);
      })
      .catch(error => console.log(error));
    }
    else if(val == false) {
        accountService.disableTwoFactorAuth();
    }
  }

  const verifySubmittedCode = (data: ToggleSwitchForm) => {
    accountService.verifyCodeTwoFactorAuth(data.code).then(response => {
        console.log("Code is valid ! ");
    })
    .catch(error => console.log(error));
  }

  if(checked == true) {
    return (
      <div className="toggle2fa">
        <div className="switch">
          <p>Disable Google Authentificator</p>
          <ReactSwitch
            checked={checked}
            onChange={handleChange}
          />
        </div>
          <p>Scan the QRCode in your application </p>
          <img id="qrcode" src={qrcode} alt="" />
          <form onSubmit={handleSubmit(verifySubmittedCode)}>
            <input type="text" name="code" placeholder="Enter the code" ></input>
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
  );
}

export default ToggleSwitch;