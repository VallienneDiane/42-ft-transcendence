import "../../styles/AvatarNameSettings.scss"
import "../../styles/Auth2faSettings.scss"
import "../../styles/Settings.scss"
import AvatarNameSettings from "./AvatarNameSettings";
import Auth2faSettings from "./Auth2faSettings";

const Settings: React.FC = () => {
  return (
    <div id="settingsPage">
      <AvatarNameSettings />
      <Auth2faSettings />
    </div>
  )
}

export default Settings;