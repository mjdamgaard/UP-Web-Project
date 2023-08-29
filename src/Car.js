import React from 'react';

class Car extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      brand: "Ford",
      model: "Mustang",
      color: "red",
      year: 1964
    };
  }
  render() {
    // return <h2>I am a {this.state.color} Car!</h2>;
    return (
      <div>
        <h1>My {this.state.brand}</h1>
        <p>
          It is
          a {this.state.color + ' '} {this.state.model + ' '}
          from {this.state.year}.
          Hello, World!
        </p>
      </div>
    );
  }
}


export default Car;
