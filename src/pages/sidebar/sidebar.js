import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import "./sidebar.css";
import Home from "../home/home";
import Profile from "../profile/profile";
import ProfileDisplay from "../profile/profile_display";
import Search from "../search/search";
import toastr from 'toastr';
import { postAPI } from "../../api/api";

const routes = [
  {
    path: "/",
    name: "Home",
    exact: true,
    main: Home,
  },
  {
    path: "/profile",
    name: "Profile",
    exact: true,
    main: Profile
  },
  {
    nested: true,
    path: "/profile/:student_key",
    name: "Student Profile",
    exact: true,
    main: ProfileDisplay
  },
  {
    path: "/search",
    name: "Search",
    main: Search,
  },
];

export default class Sidebar extends React.Component {
  state ={
    student: undefined
  }
  getData = async () => {
    try {
      const result = await postAPI("user/getStudent", {username: this.props.user.username});
      if (!result.success) {
        toastr.error("Could not find student for the user, try to set the profile");
        return
      }
      this.setState({
        student: result.data.result
      })
    } catch(err) {  
      toastr.error("Could not find student for the user, try to set the profile");
    }
  }
  componentDidMount() {
    this.getData()
  }

  render() {
    return (
      <Router>
        <div>
          <div className="side-bar">
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {routes.map(item => !item.nested && (
                  <li>
                      <Link to={item.path}>{item.name}</Link>
                  </li>
              ))}
            </ul>
  
            <ul style={{ 
              listStyleType: "none",
              padding: 0,
              position: "absolute",
              width: 230,
              bottom: 20
            }}>
              <li>
                  <a href="#" onClick={this.props.signout}> Signout </a>
              </li>
            </ul>
  
            {/* <Switch>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  exact={route.exact}
                />
              ))}
            </Switch> */}
          </div>
  
          <div className="main-content">
            <Switch>
              {routes.map((route, index) => (
                // Render more <Route>s with the same paths as
                // above, but different components this time.
                <Route
                  key={index}
                  path={route.path}
                  exact={route.exact}
                  render={ (propsToSend) => <route.main student={this.state.student} user={this.props.user} {...propsToSend} />}
                />
              ))}
            </Switch>
          </div>
        </div>
      </Router>
    );
  }
}
