import '../styles/Navbar.scss'
import React, { useContext } from "react"
import { Link, Navigate, NavLink } from "react-router-dom"
import { UserContext } from "../user/UserContext";
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
        {/* <li><NavLink to="/">Home</NavLink></li> */}
        <li><NavLink to="/game">Game</NavLink></li>
        <li><NavLink to="/chat">Chat</NavLink></li>
        <li><NavLink to="/profile">Profil</NavLink></li>
        { accountService.isLogged() ? (<li><button onClick={logout}>Log Out</button></li>) : null }
      </ul>
    </nav>
  )
}

export default NavBar;