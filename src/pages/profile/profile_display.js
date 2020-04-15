import React from 'react';
import {Card, Button} from 'react-bootstrap';
import {postAPI} from '../../api/api';

import toastr from 'toastr';
import Popup from 'reactjs-popup';
import FeedView from '../home/feedview';

import "./profile.css";

class ProfileDisplay extends React.Component {
  state = {
    open: false,
    result: undefined,
  }

  getData = async () => {
    const {student_key} = this.props.match.params;
    const result = await postAPI("student/getprofile", {
      username: this.props.user.username,
      student_key,
    });
    if (!result.success) {
      toastr.error("Something went horribly wrong. Contact the system administration")
      return;
    }
    this.setState({result: result.data.result})
  }

  updatePost = async (post_key) => {
    const updated = await postAPI("post/getpostdetail", {post_key});
    const newPost = this.state.result.posts.map(item => {
      if (item.post._key === post_key) {
        return {
          ...item,
          ...updated.data.result
        }
      }
      return item;
    });
    this.setState({
      result: {
        ...this.state.result,
        posts: newPost,
      }
    })
  }

  componentDidMount() {
    this.getData();
  }

  showmutual = () => {
    this.setState({
      open: true,
    })
  }

  unfriend = async (friend) => {
    await postAPI("student/unfriend", {username: this.props.user.username, friend_key: friend._key})
    toastr.info(`Successfully unfriended ${friend.student_name} `)
    this.getData()
  }

  addfriend = async (friend) => {
    await postAPI("student/addfriend", {username: this.props.user.username, friend_key: friend._key})
    toastr.info(`Successfully added friend ${friend.student_name} `)
    this.getData()
  }

  profileDetails = (profiles) =>
    profiles.map(profile => (
      <Card key={profile._key} style={{padding: 25, marginTop: 10, marginBottom: 10}}>
        <div className="flex"> 
          <a href={`/profile/${profile._key}`}> {profile.student_name} </a>
          {profile.isfriend && <div className="tickmark"/> }
        </div>
      </Card>
    ))

  renderResults = (item) => {
    const school = item.school[0];
    const topics = item.topics;
    return (
      <Card style={{padding: 25, marginTop: 10, marginBottom: 10}}>
        <div className="flex"> 
          <a href={`/profile/${item._key}`}> {item.student_name} </a>
          {item.isfriend && <div className="tickmark"/> }
        </div>
        {school && (  
          <div className="school"> 
            <div> Goes to School: {school.school_name} </div>
            <div> 
              {school.school_address.street}, {school.school_address.city}, {school.school_address.state} 
            </div>
          </div>
        )}
        {
          topics.length !== 0 && (
            <div className="topics">
              Interests: {topics.map(item => item.topic_text).join(", ")} 
            </div>
          )
        }
        <p onClick={() => this.showmutual()} style={{cursor: "pointer"}}> {item.mutual.length} mutual friends </p>
        <Button style={{width: 200}}  onClick={() => {
          if (item.isfriend) {
            this.unfriend(item)
          } else {
            this.addfriend(item)
          }
        }}>
          {item.isfriend ? "Unfriend" : "Addfriend"}
        </Button>
      </Card>
    )
  }

  render() {
    if (!this.state.result || !this.props.student) {
      return <div> Loading </div>
    };
    const {mutual, student, school, posts, isfriend, topics} = this.state.result;
    return (
      <div className="result">
         {
          <div className="results">
            {this.renderResults({
              ...student,
              school,
              topics,
              mutual,
              isfriend: isfriend[0],
            })}
          </div>
        }
        <FeedView
          from="profile"
          student={this.props.student}
          updatePost={this.updatePost}
          user={this.props.user}
          posts={posts}
        />

        <Popup
          open={this.state.open && mutual.length !== 0}
          closeOnDocumentClick
          onClose={this.closeModal}
        >
          <div className="popup-div">
            Mutual Friends:
            <div className="results">
              {this.profileDetails(mutual)}
            </div>
          </div>
        </Popup>
      </div>
    );
  }
}
export default ProfileDisplay;

/*
val = {
    "isfriend": [],
    "school": [
        {
            "_key": "b313f1ca-36af-42ce-8574-013299df8c1f",
            "_id": "api_School/b313f1ca-36af-42ce-8574-013299df8c1f",
            "_rev": "_aVBQTwS---",
            "school_name": "University of Michigan at Bergstromborough",
            "school_address": {
                "street": "66409 Casper Oval",
                "city": "Bergstromborough",
                "state": "Michigan"
            }
        },
        {
            "_key": "c881b85d-c670-42a9-b767-5d9679dce62a",
            "_id": "api_School/c881b85d-c670-42a9-b767-5d9679dce62a",
            "_rev": "_aVBQTwK--A",
            "school_name": "Greenfelder Ports Institute",
            "school_address": {
                "street": "7668 Aufderhar Causeway",
                "city": "East Carole",
                "state": "Nebraska"
            }
        },
        {
            "_key": "4080d09f-1c5e-4561-8cc5-4455029c8630",
            "_id": "api_School/4080d09f-1c5e-4561-8cc5-4455029c8630",
            "_rev": "_aVBQTwK--C",
            "school_name": "Walsh Stravenue College",
            "school_address": {
                "street": "545 Kozey Island",
                "city": "North Kristaland",
                "state": "Arizona"
            }
        },
        {
            "_key": "b9b35e5d-9d58-4793-9261-eaccbb3825b2",
            "_id": "api_School/b9b35e5d-9d58-4793-9261-eaccbb3825b2",
            "_rev": "_aVBQTwG---",
            "school_name": "University of Ohio at East Joelle",
            "school_address": {
                "street": "4823 Fleta Flats",
                "city": "East Joelle",
                "state": "Ohio"
            }
        }
    ],
    "posts": [
        {
            "posts": {
                "_key": "1f8ec422-7619-4a6a-bf11-343568b3f2b3",
                "_id": "api_Post/1f8ec422-7619-4a6a-bf11-343568b3f2b3",
                "_rev": "_aVBQTxG---",
                "post_text": "Quisquam impedit qui repellat natus similique eaque odit error. Suscipit est aspernatur et. Accusamus eos earum ea quia. Doloribus expedita incidunt deleniti cupiditate est quia."
            },
            "likes_on_post": [
                {
                    "_key": "90c74404-8b64-44b5-b280-01610b211c88",
                    "_id": "api_Student/90c74404-8b64-44b5-b280-01610b211c88",
                    "_rev": "_aVBQTvm---",
                    "student_name": "Jeanette O'Connell",
                    "student_DOB": "1985-02-22T04:02:08.419Z",
                    "student_sex": "F",
                    "student_address": {
                        "street": "714 Karlee Garden",
                        "city": "East Pasqualeberg",
                        "state": "Vermont"
                    },
                    "student_level": "Undergraduate"
                }
            ],
            "comments": [
                {
                    "comment": {
                        "_key": "ab39ab49-c588-4352-ad6f-98c17f8222f6",
                        "_id": "api_Comment/ab39ab49-c588-4352-ad6f-98c17f8222f6",
                        "_rev": "_aVBQTxm--A",
                        "comment_text": "Aspernatur explicabo accusantium ex maxime similique molestiae voluptates ullam in."
                    },
                    "likes_on_comment": [
                        {
                            "_key": "53c349fa-de26-40fd-b79f-4334e91f2729",
                            "_id": "api_Student/53c349fa-de26-40fd-b79f-4334e91f2729",
                            "_rev": "_aVBQTvu---",
                            "student_name": "Amie Schultz",
                            "student_DOB": "1989-02-18T22:59:58.316Z",
                            "student_sex": "M",
                            "student_address": {
                                "street": "842 Miles Hill",
                                "city": "Lynchstad",
                                "state": "West Virginia"
                            },
                            "student_level": "Undergraduate"
                        }
                    ]
                },
                {
                    "comment": {
                        "_key": "a4c226c5-0ce0-4203-8bc4-a5cac619811e",
                        "_id": "api_Comment/a4c226c5-0ce0-4203-8bc4-a5cac619811e",
                        "_rev": "_aVBQTxK---",
                        "comment_text": "Ad et et ullam nemo debitis inventore velit sit corrupti."
                    },
                    "likes_on_comment": []
                }
            ],
            "student": {
                "_key": "ff7a3267-c53f-474b-bbf6-7192226bf2fa",
                "_id": "api_Student/ff7a3267-c53f-474b-bbf6-7192226bf2fa",
                "_rev": "_aVBQTvq---",
                "student_name": "Vernice Schultz",
                "student_DOB": "1991-07-15T00:36:22.282Z",
                "student_sex": "F",
                "student_address": {
                    "street": "337 Kyra Lodge",
                    "city": "East Lynn",
                    "state": "Nebraska"
                },
                "student_level": "Graduate"
            }
        },
        {
            "posts": {
                "_key": "bd3bc878-ef2f-4828-9a08-7b525f91000e",
                "_id": "api_Post/bd3bc878-ef2f-4828-9a08-7b525f91000e",
                "_rev": "_aVBQTxC---",
                "post_text": "Aut enim repudiandae temporibus modi eum incidunt. Incidunt eveniet ratione. Aliquam quod tempore."
            },
            "likes_on_post": [
                {
                    "_key": "e6c7f5ea-7a9b-4ed2-8f6d-387211cf5e81",
                    "_id": "api_Student/e6c7f5ea-7a9b-4ed2-8f6d-387211cf5e81",
                    "_rev": "_aVBQTvO--A",
                    "student_name": "Beryl Cole",
                    "student_DOB": "1993-12-21T03:16:56.887Z",
                    "student_sex": "M",
                    "student_address": {
                        "street": "744 Klocko Walks",
                        "city": "West Garfield",
                        "state": "Arizona"
                    },
                    "student_level": "Graduate"
                }
            ],
            "comments": [
                {
                    "comment": {
                        "_key": "8cedd503-f689-4324-843a-85578a2aa0cf",
                        "_id": "api_Comment/8cedd503-f689-4324-843a-85578a2aa0cf",
                        "_rev": "_aVBQTxm---",
                        "comment_text": "Dicta nihil illum cupiditate quasi odio cumque nesciunt aliquam delectus."
                    },
                    "likes_on_comment": [
                        {
                            "_key": "25c9cc71-044c-4559-a7ba-019f2087a5fa",
                            "_id": "api_Student/25c9cc71-044c-4559-a7ba-019f2087a5fa",
                            "_rev": "_aVBQTva---",
                            "student_name": "Roy Harvey",
                            "student_DOB": "1989-03-14T05:34:13.231Z",
                            "student_sex": "F",
                            "student_address": {
                                "street": "257 Abel Motorway",
                                "city": "New Abagailtown",
                                "state": "Louisiana"
                            },
                            "student_level": "Graduate"
                        }
                    ]
                },
                {
                    "comment": {
                        "_key": "190d7493-52ae-4267-b489-b6883e3259ae",
                        "_id": "api_Comment/190d7493-52ae-4267-b489-b6883e3259ae",
                        "_rev": "_aVBQTxO---",
                        "comment_text": "Amet earum distinctio repudiandae iusto fugit quia ipsum omnis eos."
                    },
                    "likes_on_comment": [
                        {
                            "_key": "bd884437-f394-4450-a3a1-5e197ea80208",
                            "_id": "api_Student/bd884437-f394-4450-a3a1-5e197ea80208",
                            "_rev": "_aVBQTvu--A",
                            "student_name": "Mitchel Bartell",
                            "student_DOB": "1985-05-02T17:27:42.583Z",
                            "student_sex": "M",
                            "student_address": {
                                "street": "356 Michelle Branch",
                                "city": "East Emma",
                                "state": "California"
                            },
                            "student_level": "Graduate"
                        }
                    ]
                }
            ],
            "student": {
                "_key": "ff7a3267-c53f-474b-bbf6-7192226bf2fa",
                "_id": "api_Student/ff7a3267-c53f-474b-bbf6-7192226bf2fa",
                "_rev": "_aVBQTvq---",
                "student_name": "Vernice Schultz",
                "student_DOB": "1991-07-15T00:36:22.282Z",
                "student_sex": "F",
                "student_address": {
                    "street": "337 Kyra Lodge",
                    "city": "East Lynn",
                    "state": "Nebraska"
                },
                "student_level": "Graduate"
            }
        }
    ],
    "topics": []
}
*/