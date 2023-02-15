import { Link } from 'react-router-dom'
 
function Header() {
    return (
        <nav>
            <Link to="/">Login</Link>
            <Link to="/game">Accueil</Link>
        </nav>
    )
}

export default Header