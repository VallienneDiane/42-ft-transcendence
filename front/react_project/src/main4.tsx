import React, { createElement, JSXElementConstructor } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('cond');
const cond = createRoot(container!);

interface User {
  isLoggedIn: boolean;
  name?: string;
};

function UserGreeting(): JSX.Element | null {
  return null;
}

function GuestGreetings(): JSX.Element {
  return <h1>Please register</h1>;
}

function Greeting(user: User): JSX.Element {
  const isLoggedIn = user.isLoggedIn;
  if (isLoggedIn) {
    return <UserGreeting />;
  }
  return <GuestGreetings />;
}

function LoginButton(props: any): JSX.Element {
  return (
    <button onClick={props.onClick}>
      Login
    </button>
  )
}

function LogoutButton(props: any): JSX.Element {
  return (
    <button onClick={props.onClick}>
      Logout
    </button>
  )
}

class LoginControl extends React.Component<{}, User> {
  constructor(props: {}) {
    super(props);
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.handleLogoutClick = this.handleLogoutClick.bind(this);
    this.state = {isLoggedIn: false};
  }

  handleLoginClick(): void {
    this.setState({isLoggedIn: true});
  }

  handleLogoutClick(): void {
    this.setState({isLoggedIn: false});
  }

  render() {
    const isLoggedIn = this.state.isLoggedIn;
    let button: JSX.Element;
    if (isLoggedIn) {
      button = <LogoutButton onClick={this.handleLogoutClick} />
    }
    else {
      button = <LoginButton onClick={this.handleLoginClick} />
    }
    
    return (
      <div>
        <Greeting isLoggedIn={isLoggedIn} />
        {button}
        <h2>
          You are currently <b>
            {isLoggedIn 
            ? <LogoutButton onClick={this.handleLogoutClick} />
            : <LoginButton onClick={this.handleLoginClick} />
            }
            </b>
        </h2>
      </div>
    );
  }

}

cond.render(
  <div>
    <LoginControl />
  </div>
);