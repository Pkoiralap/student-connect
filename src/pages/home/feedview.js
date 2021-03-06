import React from 'react';
import Popup from 'reactjs-popup';
import uuid from "uuid/v4";
import "./feedview.css";
import { Card, Button } from 'react-bootstrap';
import { postAPI, deleteAPI, patchAPI } from '../../api/api';

export default class FeedView extends React.Component {
  state = {
    comments: {},
    disabled: {},
    show: "",
    items_to_show: [],
    post_clicked: "",
    edit: undefined,
  }

  makeComment = async (postKey) => {
    this.setState({disabled: {...this.state.disabled,[postKey]: true}});
    await postAPI("comment", {
      _key: uuid(),
      comment_text: this.state.comments[postKey],
      post_key: postKey,
      username: this.props.user.username,
    })
    this.props.updatePost(postKey)
    this.setState({
      disabled: {...this.state.disabled,[postKey]: false},
      comments: {...this.state.comments,[postKey]: ""}
    });
  }

  like = async (type, key, isLiked) => {
    await postAPI(`${type}/likeunlike`, {
      [`${type}_id`]: key,
      username: this.props.user.username,
      like: !isLiked,
    })
    const post_key = type === "post" ? key : this.state.post_clicked
    this.props.updatePost(post_key)
    this.closeModal();
  }

  closeModal = () => {
    this.setState({show: "", items_to_show: [], post_clicked: ""});
  }

  showAllComments = (comments, type="Comments", post) => {
    this.setState({
      show: type,
      items_to_show: comments,
      post_clicked: post
    })
  }

  isLiked = (likes_on_item) => {
    return likes_on_item.filter(item => item._key === this.props.student._key).length > 0
  }
  
  delete = (type, key) => async () => {
    /* eslint-disable */
    const val = confirm("Are you sure?");
    const result = await deleteAPI(`${type}/${key}`);
    const post_key = type === "post" ? key : this.state.post_clicked
    this.props.updatePost(post_key, "delete")
    this.closeModal();
  }

  edit = (type, key, text) => async () => {
    this.setState({
      edit: {
        type,
        key,
        text
      }
    })
  }

  makeEdit = async () => {
    const {text, type, key} = this.state.edit || {};
    if (!text || !type || !key) {
      toastr.error("Edit feature is facing some trouble. Contact the system administration");
      return;
    }
    await patchAPI(`${type}/${key}`, {[`${type}_text`]: text});
    const post_key = type === "post" ? key : this.state.post_clicked
    this.props.updatePost(post_key)
    this.setState({edit: undefined})
    this.closeModal()
  }

  render() {
    const {posts} = this.props;
    return (
      <div className="feed-view">
        {
          posts.map(({student, post, likes_on_post, comments }) => (
            <div key={`feed-${post._key}`} className="post">
              <Card key={`feed-card-${post._key}`}  className="post-card" style={{padding: 25, marginTop: 10, marginBottom: 10}}>
                <a href={`/profile/${student._key}`}> {student.student_name} </a>
                <br />
                <div className="post-text"> {post.post_text} </div>
                <br />
                <Button onClick={() => this.showAllComments(likes_on_post, "Likes", post._key)} className="text-left" variant="link"> {likes_on_post.length} Likes </Button>
                <div style={{display: "flex"}}>
                  <Button onClick={() => this.like("post", post._key, this.isLiked(likes_on_post))}>
                    {
                      this.isLiked(likes_on_post) ?
                      "Unlike" : "Like"
                    }
                  </Button>
                  <input
                    disabled={this.state.disabled[post._key]}
                    style={{margin: 10, padding: 5}}
                    value={this.state.comments[post._key]}
                    onKeyDown={(e) => {
                      if(e.keyCode === 13) {
                        this.makeComment(post._key)
                      }
                    }}
                    onChange={(e) => {
                      this.setState({
                        comments: {
                          ...this.state.comments,
                          [post._key]: e.target.value,
                        }
                      })
                    }}
                    type="string"
                  />
                  <Button onClick={() => this.makeComment(post._key)}> Comment </Button>
                  <Button
                    style={{float:"right"}}
                    onClick={() => this.showAllComments(comments, "Comments", post._key)}
                  > 
                    Show all comments
                  </Button>
                  {
                    student._key === this.props.student._key && (
                      <div className="action-items" style={{display: "flex"}}>
                        <Button variant="info" onClick={this.edit("post", post._key, post.post_text)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={this.delete("post", post._key)}>
                          Delete
                        </Button>
                      </div>
                    )
                  }
                </div>
              </Card>
            </div>
          ))
        }
        <Popup
          open={this.state.show}
          closeOnDocumentClick
          onClose={this.closeModal}
        >
          <div className="popup-div">
            {this.state.show}:
            <div className="results">
              {
                this.state.items_to_show.map(item => this.state.show === "Comments" ? (
                  <Card key={`comment-${item.comment._key}`} className="post-card" style={{padding: 25, marginTop: 10, marginBottom: 10}}>
                    <a href={`/profile/${item.student[0]._key}`}> {item.student[0].student_name} </a>
                    <br />
                    {
                      this.state.show === "Comments" && (
                        <div>
                          <div>
                            {item.comment.comment_text}
                          </div>
                          <div>
                            <Button className="text-left" variant="link"> 
                              {item.likes_on_comment.length} Likes 
                            </Button>
                            <Button onClick={() => this.like("comment", item.comment._key, this.isLiked(item.likes_on_comment))} variant="primary"> 
                              {this.isLiked(item.likes_on_comment) ? "Unlike": "Like"}
                            </Button>
                            {
                              item.student[0]._key === this.props.student._key && (
                                <div className="action-items" style={{display: "flex"}}>
                                  <Button variant="info" onClick={this.edit("comment", item.comment._key, item.comment.comment_text)}>
                                    Edit
                                  </Button>
                                  <Button variant="danger" onClick={this.delete("comment", item.comment._key)}>
                                    Delete
                                  </Button>
                                </div>
                              )
                            }
                          </div>
                        </div>
                        )
                    }
                  </Card>
                ) : (
                  <Card className="post-card" style={{padding: 25, marginTop: 10, marginBottom: 10}}>
                    <a href={`/profile/${item._key}`}> {item.student_name} </a>
                  </Card>
                ))
              }
            </div>
          </div>
        </Popup>
        <Popup
          open={this.state.edit}
          onClose={() => {this.setState({edit: undefined})}}
          closeOnDocumentClick
        >
          <div style={{padding: 20}}>
            <textarea
              style={{width: "100%", maxWidth: 500}}
              onChange={(e) => {
                this.setState({edit: {
                  ...this.state.edit,
                  text: e.target.value
                }})
              }}
              rows="5"
              value={this.state.edit && this.state.edit.text}
            />
            <br />
            <Button onClick={this.makeEdit}> Edit </Button>
          </div>
        </Popup>
      </div>
    )
  }
}