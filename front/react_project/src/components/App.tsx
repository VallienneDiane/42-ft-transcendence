import '../styles/App.css'
import photoAzu from '../assets/DSC09400-10.jpg'
import React from 'react'

type MyProps = {
  message: string;
};

type MyState = {
  count: number;
};

class IncButton extends React.Component<MyProps, MyState> {
state: MyState = {
  count: 0,
};
render() {
  return (
    <div>
    <button className="square" onClick={() => this.setState({count: this.state.count + 1})}> {this.props.message} {this.state.count}
    </button>
  </div>
  );
}
}

interface user {
  firstName: string,
  lastName: string,
};

function FormatName(user: user): string {
  return user.firstName + ' ' + user.lastName;
}

function Avatar({text}: {text: string}): JSX.Element {
  return (
    <img src={text} className="photo" alt="Photo d'Azu" />
  );
}

function ActionLink() {
  function handleClick(e) {
      e.preventDefault();
      console.log('Le lien a été cliqué.');
  }
  return (
    <a href="#" onClick={handleClick}> Clique ici </a>
  );
}

function App(user: user) {
  return (
    <div className="intro">
      <h1> Bonjour, {FormatName(user)} !  </h1>
      <Avatar text={photoAzu} />
      <div className="test">
      <IncButton message="Vous avez clique " />
      <ActionLink />
    </div>
    </div>
  );
}

export default App
