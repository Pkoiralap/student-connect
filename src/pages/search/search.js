import React from 'react';
import {Button, Form} from 'react-bootstrap';
import {postAPI} from '../../api/api';
import FriendsDisplay from './friend_display';

import "./search.css";

class Search extends React.Component {
  state = {
    result: [],
    name: "",
  }

  getData = async () => {
    const result = await postAPI("student/search", {username: this.props.user.username, name: this.state.name});
      if (result.success && result.data.success) {
        this.setState({
          result: result.data.result,
        });
      }
  }

  componentDidMount() {
    this.getData();
  }

  render() {
    const {result} = this.state;
    return (
      <div>
        <div className="search-bar">
          <div className="flex">
            <form onSubmit={this.getData}>
              <Form.Control
                type="string"
                placeholder="Enter names to search"
                onChange={e => {this.setState({name: e.target.value})}} 
              />
            </form>
            <Button onClick={this.getData}> Search </Button>
          </div>
        </div>
        <FriendsDisplay getData={this.getData} user={this.props.user} result={result} />
      </div>
      
    );
  }

}
export default Search;
