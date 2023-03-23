// import { useState } from "react";
// import { useHistory } from "react-router-dom";

// Avec OAuth2, vous devrez interagir directement avec l'API 42 pour effectuer l'authentification. 
// Voici les étapes générales que vous devrez suivre:
// L'utilisateur clique sur le lien "Se connecter avec 42" et est redirigé vers l'URL d'authentification de 42.
// L'utilisateur se connecte à 42 et autorise votre application à accéder à ses informations.
// L'utilisateur est redirigé vers votre application avec un code temporaire dans l'URL.
// Votre application utilise ce code pour récupérer un jeton d'accès permanent auprès de l'API 42.
// Votre application utilise ce jeton d'accès pour effectuer des appels à l'API 42 au nom de l'utilisateur connecté.

// Cet exemple utilise fetch pour effectuer les requêtes HTTP nécessaires pour l'authentification OAuth2. 
// Il utilise également window.open pour ouvrir une nouvelle fenêtre qui affiche la page d'autorisation OAuth2. 
// Une fois que l'utilisateur a autorisé l'application, la page redirige vers redirect_uri avec un paramètre code, 
// qui est ensuite échangé contre un jeton d'accès en appelant exchangeCodeForToken. 
// Le jeton d'accès est ensuite stocké dans le stockage local ou la gestion de l'état, selon votre préférence.

// const Login42: React.FC = () => {

// }

// type OAuth2Token = {
//   access_token: string;
//   token_type: string;
//   expires_in: number;
//   refresh_token: string;
//   scope: string;
// };

// type OAuth2Credentials = {
//   client_id: string;
//   client_secret: string;
//   redirect_uri: string;
//   authorization_endpoint: string;
//   token_endpoint: string;
//   scope: string;
// };

// const authorizeUrl = (credentials: OAuth2Credentials) => {
//   const params = new URLSearchParams({
//     client_id: credentials.client_id,
//     redirect_uri: credentials.redirect_uri,
//     scope: credentials.scope,
//     response_type: "code",
//   });
//   return `${credentials.authorization_endpoint}?${params.toString()}`;
// };

// const exchangeCodeForToken = async (
//   credentials: OAuth2Credentials,
//   code: string
// ) => {
//   const formData = new FormData();
//   formData.append("client_id", credentials.client_id);
//   formData.append("client_secret", credentials.client_secret);
//   formData.append("grant_type", "authorization_code");
//   formData.append("redirect_uri", credentials.redirect_uri);
//   formData.append("code", code);

//   const response = await fetch(credentials.token_endpoint, {
//     method: "POST",
//     body: formData,
//   });
//   return response.json() as Promise<OAuth2Token>;
// };

// const LoginPage = () => {
//   const [error, setError] = useState<string | null>(null);
//   const history = useHistory();

//   const handleLogin = async () => {
//     const credentials: OAuth2Credentials = {
//       client_id: "u-s4t2ud-1a615688dd073d243be0d59bf7ff2953367300048cd88c855c08d4f2dd0efe4c",
//       client_secret: "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",
//       redirect_uri: "http://localhost:3000/callback",
//       authorization_endpoint: "https://example.com/oauth2/authorize",
//       token_endpoint: "https://example.com/oauth2/token",
//       scope: "email",
//     };

//     try {
//       const authUrl = authorizeUrl(credentials);
//       const code = await new Promise<string>((resolve) => {
//         const newWindow = window.open(authUrl, "_blank");
//         const receiveMessage = (event: MessageEvent) => {
//           if (event.origin === window.location.origin) {
//             const params = new URLSearchParams(event.data);
//             const code = params.get("code");
//             if (code) {
//               resolve(code);
//               newWindow?.close();
//             }
//           }
//         };
//         window.addEventListener("message", receiveMessage, false);
//       });

//       const token = await exchangeCodeForToken(credentials, code);
//       // save token in local storage or state management
//       history.push("/");
//     } catch (err) {
//       setError("Failed to login");
//     }
//   };

//   return (
//     <div>
//       <h1>Login page</h1>
//       <button onClick={handleLogin}>Login with OAuth2</button>
//       {error && <div>{error}</div>}
//     </div>
//   );
// };

export default Login42;
