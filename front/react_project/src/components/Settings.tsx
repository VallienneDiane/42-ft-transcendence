import "../styles/Settings.scss"
import AvatarSettings from "./AvatarSettings";
import LogSettings from "./LogSettings";

const Settings: React.FC = () => {
  return (
    <div id="settingsPage">
      <AvatarSettings />
      <LogSettings />
    </div>
  )
}

export default Settings;