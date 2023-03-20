import '../styles/Navbar.css'
import React, { useContext } from "react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";

const NavBar: React.FC = () => {
  let navigate = useNavigate();

  const logout = () => {
    accountService.logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/game">Game</Link></li>
        <li><Link to="/chat">Chat</Link></li>
        <li><Link to="/profile">Profil</Link></li>
        <li><Link to="/settings">Settings</Link></li>
        { accountService.isLogged() ? (<li><button onClick={logout}>Log Out</button></li>) : null }
      </ul>
    </nav>
  )
}

export default NavBar;