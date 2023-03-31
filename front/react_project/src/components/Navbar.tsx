import '../styles/Navbar.scss'
import React, { useContext, useState } from "react"
import { NavLink, Link } from "react-router-dom"
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";

const NavBar: React.FC = () => {
  let navigate = useNavigate();
  const [burgerList, setBurgerList] = useState<boolean>(false)

  const logout = () => {
    accountService.logout();
    navigate("/login");
  }

  const burgerClick = () => {
    setBurgerList(!burgerList);
  }

  const homeClick = () => {
    if (burgerList) {
      setBurgerList(!burgerList);
    }
  }

  return (
    <nav id="navbar">
      <div id='logo'><NavLink onClick={homeClick} to="/">ft_transcendance</NavLink></div>
      <div id="burger" onClick={burgerClick}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
      <ul id='links' onClick={burgerClick} className={burgerList? 'burgerList': ''}>
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