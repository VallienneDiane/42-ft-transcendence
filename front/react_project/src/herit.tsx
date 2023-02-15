import React, { createElement } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import './App.css'

const container = document.getElementById('herit');
const herit = createRoot(container!);

interface Iprops {
  color: string;
  children: React.ReactNode;
}

interface IpropsSplit {
  left: React.ReactNode;
  right: React.ReactNode;
}

function FancyBorder(props: Iprops): JSX.Element {
  return (
    <div className={'FancyBorder FancyBorder-' + props.color}>
      {props.children}
    </div>
  );
}

function WelcomeDialog(): JSX.Element {
  return (
    <FancyBorder color = "blue">
      <h1 className="Dialog-title">
        Welcome.
      </h1>
      <p className="Dialog-message">
        thanks to visit.
      </p>
    </FancyBorder>
  );
}

function SplitPane(props: IpropsSplit): JSX.Element {
  return (
    <div className="SplitPane">
      <div className="SplitPane-left">
        {props.left}
      </div>
      <div className="SplitPane-right">
        {props.right}
      </div>
    </div>
  );
}

function App(): JSX.Element {
  return (
    <SplitPane left={
      <p>hey</p>
    }
    right={
      <p>hey right</p>
    } />
  )
}

herit.render(
  <div>
    <WelcomeDialog />
    <App />
  </div>
)