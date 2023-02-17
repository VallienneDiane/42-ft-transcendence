import { useRouteError } from "react-router-dom";
import '../../styles/Login.css'

export default function ErrorPage() {
  return (
    <div className="App" id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
    </div>
  );
}
