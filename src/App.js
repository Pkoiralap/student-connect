import React from 'react';
import { Container } from 'react-bootstrap';

import Sidebar from './pages/sidebar/sidebar';
import Login from './pages/login/login';
import './App.css';

const validateUser = () => {
  const user = JSON.parse(window.localStorage.getItem("user"));
  return user;
}

const populateLocalstore = (user) => {
  window.localStorage.setItem("user", JSON.stringify(user));
}

const deleteLocalStorage = () => {
  window.localStorage.removeItem("user");
}

class App extends React.Component{
  state={
    logged_in: !!validateUser(),
    user: validateUser(),
  }

  login_success = (user) => {
    populateLocalstore(user);
    this.setState({ logged_in: true, user });
  }

  signout = () => {
    deleteLocalStorage();
    this.setState({ logged_in: false, user: undefined });
  }

  render() {
    console.log(this.state.logged_in)
    return (
      <div>
        {this.state.logged_in ? (
          <Sidebar user={this.state.user} signout={this.signout}/>
        ): (
          <Login login_success={this.login_success} />
        )}
      </div>
    )
  }
}

export default App;
