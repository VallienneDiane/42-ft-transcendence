import React, { createElement } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('event');
const event = createRoot(container!);

interface Switch {
  isToggleOn: boolean;
};

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

event.render(
  <Toggle />
)