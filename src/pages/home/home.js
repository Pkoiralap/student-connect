import React from 'react';
import { postAPI } from '../../api/api';
import FeedView from './feedview';
import { Card, Button } from 'react-bootstrap';
import uuid from 'uuid/v4';

export default class Login extends React.Component {
  state = {
    posts: [],
    status: "",
  }

  getData = async () => {
    const data = await postAPI("post/getfeed", {username: this.props.user.username});
    this.setState({
      posts: data.data ? data.data.result : [],
    })
  }
  
  componentDidMount() {
    this.getData();
  }

  postStatus = async () => {
    await postAPI("post", {
      _key: uuid(),
      post_text: this.state.status,
      username: this.props.user.username,
    })
    this.setState({status: ""})
    this.getData();
  }

  updatePost = async (post_key, deleted) => {
    if (deleted) {
      await this.getData();
      return;
    }
    const updated = await postAPI("post/getpostdetail", {post_key});
    const newPost = this.state.posts.map(item => {
      if (item.post._key === post_key) {
        return {
          ...item,
          ...updated.data.result
        }
      }
      return item;
    });
    this.setState({
      posts: newPost
    })
  }

  render() {
    if (!this.state.posts.length || !this.props.student) {
      return <div> Empty feed. Did you add friends? </div>
    }
    return (
      <div>
        <Card className="post-card" style={{padding: 25, marginTop: 10, marginBottom: 10}}>
          <label for="status"> Status </label>
          <textarea
            value={this.state.status}
            rows="10"
            placeholder="What is on your mind?"
            onChange={(e) => {this.setState({status: e.target.value})}}
          />
          <Button onClick={this.postStatus}> Post </Button>
        </Card>
        <FeedView
          student={this.props.student}
          updatePost={this.updatePost}
          user={this.props.user}
          posts={this.state.posts}
        />
      </div>
    )
  }
}
