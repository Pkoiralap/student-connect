import uuid from 'uuid/v4';
import React from 'react';
import {Row, Col, Card, Button, Form} from 'react-bootstrap';
import toastr from 'toastr';
import Select from 'react-select';

import {getAPI, postAPI, putAPI} from '../../api/api';

const order = [
  {name: "_key", label: "Key", placeholder: "Enter _key", disabled: true },
  {name: "student_name", label: "Name", placeholder: "Enter student_name",  },
  {name: "student_DOB", label: "DOB", placeholder: "Enter student_DOB",  },
  {name: "student_sex", label: "Sex (M/F)", placeholder: "Enter student_sex",  },
  {name: "street", label: "Street", placeholder: "Enter street",  },
  {name: "city", label: "City", placeholder: "Enter city",  },
  {name: "state", label: "State", placeholder: "Enter state",  },
  {name: "school", label: "School", placeholder: "Enter school", type: "select" },
  {name: "topics", label: "Topics", placeholder: "Enter topics", type: "select", multiple: true },
]
const initialValues = {
  _key: uuid(),
  student_name: "",
  student_DOB: "",
  student_sex: "",
  street: "",
  city: "",
  state: "",
  school: "",
  topics: [],
};

export default class Profile extends React.Component {
  state = initialValues;
  
  update = (upd) => {
    this.setState(upd);
  }

  componentDidMount() {
    const getData = async () => {
      let toUpdate = {};
      const userProfile = await postAPI("user/get_user_profile", {username: this.props.user.username});
      if (!userProfile.success || (userProfile.success && !userProfile.data.profile)) {
        toastr.info("The user doesn't have any student linked to it. Please create a profile")
        toUpdate = {created: false};
      } else {
        toUpdate = {...userProfile.data.profile, created: true}
        toUpdate.school = {value: toUpdate.school.school_name, label: toUpdate.school.school_name};
        toUpdate.topics = toUpdate.topics.map(item => ({ value: item.topic_text, label: item.topic_text }));

        const {street, city, state} = toUpdate.student_address;
        delete toUpdate.student_address;
        toUpdate = {...toUpdate, street, city, state};
      }
      const {data: schools} = await getAPI("school");
      const {data: topics} = await getAPI("topic");
      toUpdate = {...toUpdate, school_available: schools, topics_available: topics};
      console.log({...this.state, ...toUpdate})
      this.update(toUpdate);
    }
    getData();
  }

  handleSubmit = async () => {
    const newData = {
      student_name: this.state.student_name,
      student_DOB: this.state.student_DOB,
      student_sex: this.state.student_sex,
      student_address: {
        street: this.state.street,
        city: this.state.city,
        state: this.state.state,
      }
    }
    if (this.state.created) {
      await putAPI(`/student/${this.state._key}`, newData);
    } else {
      await postAPI("/student", {...newData, _key: this.state._key});
    }

    await postAPI("/student/changetopics", {student_key: this.state._key, topics: this.state.topics.map(item => item.value)});
    await postAPI("/student/changeschool", {student_key: this.state._key, school_name: this.state.school.value});
    await postAPI("/user/set_user_profile", {username: this.props.user.username, student_key: this.state._key});
    toastr.success("User created successfully. Now add friends to see their updates.");
    this.update({created: true})
  }

  render() {
    return (
      <div className="profile">
        <Row>
          <Col xs={12}>
            <Card>
              <Card.Header>Profile</Card.Header>
              <Card.Body>
                <Form noValidate> 
                  {
                    order.map(item => (
                      <Form.Group key={item.name} controlId={item.name}>
                        <Form.Label>{item.label}</Form.Label>
                        {
                          item.type === "select" ? (
                            <Select
                              disabled={item.disabled}
                              value={this.state[item.name]} 
                              onChange={(val) => {
                                  this.update({[item.name] : val})
                              }} 
                              isMulti={item.multiple}
                              placeholder={item.placeholder}
                              style={item.multiple ? {height: 100}: {}}
                              options={(this.state[`${item.name}_available`] || []).map(val => ({
                                value: val.school_name || val.topic_text,
                                label: val.school_name || val.topic_text,
                              }))}
                            />
                          ) : (
                            <Form.Control
                              required
                              disabled={item.disabled}
                              value={this.state[item.name]} 
                              onChange={(e) => this.update({[item.name] : e.target.value})} 
                              placeholder={item.placeholder}
                            />
                          )
                        }
                      </Form.Group>
                    ))
                  }
                  <Button onClick={this.handleSubmit}>{this.state.created ? "Update" : "Create"}</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
};