import React, { ReactComponentElement, ReactPropTypes } from "react";

type MyState = {
    value: any;
};

class NameForm extends React.Component<{}, MyState> {
    constructor(props: {}) {
      super(props);
      this.state = {value: ''};
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    handleChange(event: any) {
        this.setState({value: event.target.value});
    }
    handleSubmit(event: any) {
      alert('Le nom a été soumis : ' + this.state.value);
      event.preventDefault();
    }
  
    render() {
      return (
        <form onSubmit={this.handleSubmit}>
          <label>
            Nom :
            <input type="text" value={this.state.value} onChange={this.handleChange} />
                    </label>
          <input type="submit" value="Envoyer" />
        </form>
      );
    }
}