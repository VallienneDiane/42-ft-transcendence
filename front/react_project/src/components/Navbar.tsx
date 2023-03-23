import '../styles/Navbar.scss'
import React from "react"
import { NavLink} from "react-router-dom"
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";

const NavBar: React.FC = () => {
  let navigate = useNavigate();

  const logout = () => {
    accountService.logout();
    navigate("/login");
  }

  return (
    <nav id="navbar">
      <div><NavLink to="/">ft_transcendance</NavLink></div>
      <ul>
        <li><NavLink to="/game">Game</NavLink></li>
        <li><NavLink to="/chat">Chat</NavLink></li>
        <li><NavLink to="/profile">Profil</NavLink></li>
        <li><NavLink to="/settings">Settings</NavLink></li>
        { accountService.isLogged() ? (<li><button onClick={logout}>Log Out</button></li>) : null }
      </ul>
    </nav>
  )
}

export default NavBar;