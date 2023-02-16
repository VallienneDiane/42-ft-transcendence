import { Outlet } from "react-router-dom";
import Screen from '../assets/kisspng-pixel-art-television-5b0047937f0237.2236584415267449795202.png'

export default function Home() {
    return (
        <div>
        <img src={Screen} className="photo" alt="Photo d'ecran" />
        <div id="detail">
        <Outlet />
      </div>
      </div>
    );
}

  