import React, { createElement } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('form');
const form = createRoot(container!);

interface Istring {
  string: string
};

interface Inumber {
  number: number
};

interface IUser {
  name: string;
  pseudo: string;
  email: string;
  fruit: string
};

class DefaultForm extends React.Component<{}, IUser> {
  constructor(sale: {}) {
    super(sale);
    this.state = {name: '', pseudo: '', email: '', fruit: ''};

    this.handleNameChange = this.handleNameChange.bind(this);
    this.handlePseudoChange = this.handlePseudoChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFruitChange = this.handleFruitChange.bind(this);
  }

  handleNameChange(_name: any) {
    this.setState({name: _name.target.value});    
  }

  handlePseudoChange(_pseudo: any): void {
    this.setState({pseudo: _pseudo.target.value});
  }

  handleEmailChange(_email: any): void {
    this.setState({email: _email.target.value});
  }

  handleFruitChange(_fruit: any): void {
    this.setState({fruit: _fruit.target.value});
  }

  handleSubmit(event: any): void {
    alert('This guy is registered : ' + this.state.name + ' ' + this.state.pseudo + ' ' + this.state.email + ' ' + this.state.fruit);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          name :
          <input type="text" value={this.state.name} onChange={this.handleNameChange} />
        </label>
        <br />
        <label>
          pseudo :
          <input type="text" value={this.state.pseudo} onChange={this.handlePseudoChange} />
        </label>
        <br />
        <label>
          email :
          <input type="text" value={this.state.email} onChange={this.handleEmailChange} />
        </label>
        <br />
        <label>
          fruit :
          <select value={this.state.fruit} onChange={this.handleFruitChange}>
            <option value="cherry">Cerise</option>
            <option value='peer'>Poire</option>
            <option value='apple'>Pomme</option>
            <option value='orange'>Orange</option>
            <option value='mango'>Mangue</option>
          </select>
        </label>
        <input type="submit" value="send" />
      </form>
    );
  }

}

form.render(<DefaultForm />);