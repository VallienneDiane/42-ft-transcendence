import React from "react"
import { Link } from "react-router-dom"

const NavBar: React.FC = () => {
  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/profile">Profil</Link></li>
        <li><Link to="/">Game</Link></li>
        <li><Link to="#">Chat</Link></li>
        <li><Link to="#">Quit</Link></li>
      </ul>
    </nav>
  )
}

export default NavBar;