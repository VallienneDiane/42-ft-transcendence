import React, { createElement } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('event');
const event = createRoot(container!);

interface Switch {
  isToggleOn: boolean;
};

interface TIS_Number {
  number: number;
}

class Toggle extends React.Component<{}, Switch> {
  constructor(props: {}) {
    super(props);
    this.state = {isToggleOn: true};
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState(state => ({
      isToggleOn: !state.isToggleOn
    }));
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        {this.state.isToggleOn ? 'ON' : 'OFF'}
      </button>
    );
  }
}

class Toggle2 extends React.Component<{}, TIS_Number> {
  constructor(props: {}) {
    super(props);
    this.state = {number: 0};
    this.handleClick = this.handleClick.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  handleClick() {
    this.setState(state => ({
      number: state.number + 1
    }));
  }

  handleDoubleClick() {
    this.setState(state => ({
      number: 0
    }));
  }

  render() {
    return (
      <button onClick={this.handleClick} onDoubleClick={this.handleDoubleClick} onMouseLeave={this.handleDoubleClick}>
        my count is {this.state.number}
      </button>
    )  
}
}

event.render(
  <div>
    <Toggle />
    <Toggle2 />
  </div>
)