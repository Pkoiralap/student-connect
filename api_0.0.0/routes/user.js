'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const query = require("@arangodb").query;
const createAuth = require('@arangodb/foxx/auth');
const createRouter = require('@arangodb/foxx/router');
const sessionsMiddleware = require('@arangodb/foxx/sessions');

const User = require('../models/user');

const UserItems = module.context.collection('User');
const StudentItems = module.context.collection('Student');
const RelationItems = module.context.collection('Relation');

const keySchema = joi.string().required()
.description('The key of the user');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');


const sessions = sessionsMiddleware({
  storage: module.context.collection('Session'),
  transport: 'cookie'
});
module.context.use(sessions);

const auth = createAuth();
const router = createRouter();
module.exports = router;


router.tag('user');

router.get(function (req, res) {
  res.send(UserItems.all());
}, 'list')
.response([User], 'A list of UserItems.')
.summary('List all UserItems')
.description(dd`
  Retrieves a list of all UserItems.
`);


router.post(function (req, res) {
  const user = req.body;
  let meta;
  try {
    meta = UserItems.save(user);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(user, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: user._key})
  ));
  res.send(user);
}, 'create')
.body(User, 'The user to create.')
.response(201, User, 'The created user.')
.error(HTTP_CONFLICT, 'The user already exists.')
.summary('Create a new user')
.description(dd`
  Creates a new user from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let user
  try {
    user = UserItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(user);
}, 'detail')
.pathParam('key', keySchema)
.response(User, 'The user.')
.summary('Fetch a user')
.description(dd`
  Retrieves a user by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const user = req.body;
  let meta;
  try {
    meta = UserItems.replace(key, user);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(user, meta);
  res.send(user);
}, 'replace')
.pathParam('key', keySchema)
.body(User, 'The data to replace the user with.')
.response(User, 'The new user.')
.summary('Replace a user')
.description(dd`
  Replaces an existing user with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let user;
  try {
    UserItems.update(key, patchData);
    user = UserItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(user);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the user with.'))
.response(User, 'The updated user.')
.summary('Update a user')
.description(dd`
  Patches a user with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    UserItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a user')
.description(dd`
  Deletes a user from the database.
`);

router.get('/whoami', function (req, res) {
  try {
    const user = UserItems.document(req.session.uid);
    res.send(user);
  } catch (e) {
    res.send({success: false});
  }
})
.description('Returns the currently active username.');

router.post('/login', function (req, res) {
  // This may return a user object or null
  const user = UserItems.firstExample({
    username: req.body.username
  });
  const valid = auth.verify(
    // Pretend to validate even if no user was found
    user.authData,
    req.body.password
  );
  if (!valid) res.throw('unauthorized');
  // Log the user in
  req.session.uid = user._key;
  req.sessionStorage.save(req.session);
  res.send({success: true, _key: user._key});
})
.body(joi.object({
  username: joi.string().required(),
  password: joi.string().required()
}).required(), 'Credentials')
.description('Logs a registered user in.');

router.post('/logout', function (req, res) {
  if (req.session.uid) {
    req.session.uid = null;
    req.sessionStorage.save(req.session);
  }
  res.send({success: true});
})
.description('Logs the current user out.');

router.post('/signup', function (req, res) {
  const user = req.body;
  let meta = {};
  try {
    // Create an authentication hash
    user.authData = auth.create(user.password);
    delete user.password;
    meta = UserItems.save(user);
    Object.assign(user, meta);
  } catch (e) {
    // Failed to save the user
    // We'll assume the UniqueConstraint has been violated
    res.throw('bad request', 'Username already taken', e);
  }
  // Log the user in
  req.session.uid = user._key;
  req.sessionStorage.save(req.session);
  res.send({success: true, _key: meta._key});
})
.body(joi.object({
  username: joi.string().required(),
  password: joi.string().required()
}).required(), 'Credentials')
.description('Creates a new user and logs them in.');


router.post('/get_user_profile', function (req, res) {
  const user = UserItems.firstExample({
    username: req.body.username
  });

  try {
    const profile = query`
      for v,e in 1 outbound ${user} graph "student-connect"
      filter like(v._id, "api_Student/%")
      let school = (
        for v1,e1 in 1 outbound v graph "student-connect"
        filter like(v1._id, "api_School/%")
        return v1
      )

      let topics = (
        for v2,e2 in 1 outbound v graph "student-connect"
        filter like(v2._id, "api_Topic/%")
        return v2
      )

      return merge(v, {school: school[0], topics: topics })
    `.toArray();
    
    res.send({success: true, profile: profile[0]});
  } catch (e) {
    // Failed to save the user
    // We'll assume the UniqueConstraint has been violated
    res.throw(500, 'Something went wrong. Contact administrator', e);
  }
})
.body(joi.object({
  username: joi.string().required()
}).required(), 'Credentials')
.description('Gets user profile.');


router.post('/set_user_profile', function (req, res) {
  try {
    const user = UserItems.firstExample({
      username: req.body.username
    });
  
    const student = StudentItems.firstExample({
      _key: req.body.student_key,
    })
  
    const meta = RelationItems.save({
      _from: user._id,
      _to: student._id,
      type: "points_to"
    })
  
    res.send({success: true, meta });
  } catch (e) {
    res.throw(500, 'Something went wrong. Contact administrator', e);
  }
})
.body(joi.object({
  username: joi.string().required(),
  student_key: joi.string().required(),
}).required(), 'linking')
.description('Gets user profile.');


router.post('/getStudent', function (req, res) {
  try {
    const user = UserItems.firstExample({
      username: req.body.username
    });
  
   const value = query`
    for v,e in 1 outbound ${user} graph "student-connect"
    filter e.type == "points_to"
    return v

   `.toArray()
  
    res.send({success: true, result: value[0] });
  } catch (e) {
    res.throw(500, 'Something went wrong. Contact administrator', e);
  }
})
.body(joi.object({
  username: joi.string().required(),
}).required(), 'linking')
.description('Gets student from user.');

