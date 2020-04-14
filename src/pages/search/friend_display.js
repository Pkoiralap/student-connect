import React from 'react';
import {Card, Button} from 'react-bootstrap';
import {postAPI} from '../../api/api';

import toastr from 'toastr';
import Popup from 'reactjs-popup';

class FriendsDisplay extends React.Component {
  state = {
    open: false,
    mutuals: []
  }

  unfriend = async (friend) => {
    await postAPI("student/unfriend", {username: this.props.user.username, friend_key: friend._key})
    toastr.info(`Successfully unfriended ${friend.student_name} `)
    this.props.getData()
  }

  addfriend = async (friend) => {
    await postAPI("student/addfriend", {username: this.props.user.username, friend_key: friend._key})
    toastr.info(`Successfully added friend ${friend.student_name} `)
    this.props.getData()
  }

  showmutual = (item) => {
    this.setState({
      open: true,
      mutuals: item,
    })
  }

  closeModal = () => {
    this.setState({
      open: true,
      mutuals: [],
    })
  }

  profileDetails = (profile) => (
    <div className="flex"> 
        <a href={`/profile/${profile._key}`}> {profile.student_name} </a>
        {profile.isfriend && <div className="tickmark"/> }
      </div>
  )

  renderResults = (result, mutual=true) => {
    return result.map(item => (
      <Card style={{padding: 25, marginTop: 10, marginBottom: 10}}>
        {this.profileDetails(item)}
        {mutual && (
          <>
            <p onClick={() => this.showmutual(item.mutual)} style={{cursor: "pointer"}}> {item.mutual.length} mutual friends </p>
            <Button style={{width: 200}}  onClick={() => {
              if (item.isfriend) {
                this.unfriend(item)
              } else {
                this.addfriend(item)
              }
            }}>
              {item.isfriend ? "Unfriend" : "Addfriend"}
            </Button>
          </>
        )}
      </Card>
    ))
  }

  render() {
    const {result} = this.props;
    return (
      <div className="result">
         {
          result.length === 0 ? (
            <div className="empty-div">
              No results found. Please try some another query.
            </div>
          ): (
            <div className="results">
              {this.renderResults(result)}
            </div>
          )
        }

        <Popup
          open={this.state.open && this.state.mutuals.length !== 0}
          closeOnDocumentClick
          onClose={this.closeModal}
        >
          <div className="popup-div">
            Mutual Friends:
            <div className="results">
              {this.renderResults(this.state.mutuals, false)}
            </div>
          </div>
        </Popup>
      </div>
    );
  }

}
export default FriendsDisplay;
