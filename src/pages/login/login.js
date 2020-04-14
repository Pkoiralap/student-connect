import React, {useState} from 'react';
import {Row, Col, Card, Button, Form} from 'react-bootstrap';
import toastr from 'toastr';

import {postAPI} from '../../api/api';
import logo from './logo.png';
import './login.css';

function Login(props) {
  const [values, setValues] = useState({});

  const update = (key, value) => {
    setValues({
      ...values,
      [key]: value
    })
  }
  const handleSubmit = async (type) => {
    if (!values.username || !values.password) {
      toastr.error("Username and password can not be empty.");
      return;
    }

    const result = await postAPI(`user/${type}`, values);
    if (result.success && result.data.success) {
      props.login_success({...values, _key: result.data._key});
    } else {
      toastr.error("Invalid username and password.");
    }
  };

  return (
    <Row className="justify-content-md-center">
      <Col xs={6}>
        <div className="info">
          <h3> Welcome to Student Connect</h3>
          <img src={logo} alt="logo" />
          <div className="form">
          </div>
        </div>
        <br />
        <br />
        <Card className="text-center">
          <Card.Header>Login</Card.Header>
          <Card.Body>
            <Form
              noValidate
              validated={values.valid}
              onSubmit={(e) => {
                handleSubmit("login")
              }}
            >
              <Form.Group controlId="username">
                <Form.Label>Username</Form.Label>
                <Form.Control 
                  required 
                  value={values.username} 
                  onChange={(e) => update("username", e.target.value)} 
                  type="string" 
                  placeholder="Enter Username" />
              </Form.Group>
              <Form.Group controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  required
                  value={values.password}
                  onChange={(e) => update("password", e.target.value)} 
                  type="password"
                  placeholder="Password" />
              </Form.Group>
              <Button onClick={(e) => handleSubmit('login')}>Login</Button>
              <Button onClick={(e) => handleSubmit('signup')}>Signup</Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

export default Login;
