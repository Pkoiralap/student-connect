'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const query = require("@arangodb").query;
const aql = require("@arangodb").aql;
const createRouter = require('@arangodb/foxx/router');
const Post = require('../models/post');
const {getFriends, getPosts, getPostById} = require("./utils");

const UserItems = module.context.collection('User');
const PostItems = module.context.collection('Post');
const RelationItems = module.context.collection('Relation');

const keySchema = joi.string().required()
.description('The key of the post');


const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('post');


router.get(function (req, res) {
  res.send(PostItems.all());
}, 'list')
.response([Post], 'A list of PostItems.')
.summary('List all PostItems')
.description(dd`
  Retrieves a list of all PostItems.
`);


router.post(function (req, res) {
  const {username, ...post } = req.body;
  let meta;
  try {
    meta = PostItems.save(post);
    let user = UserItems.firstExample({
      username: req.body.username
    });

    const student = query`
      for v,e in 1 outbound ${user} graph "student-connect"
      filter e.type == "points_to" 
      return v
    `.toArray();

    RelationItems.save({
      _from: student[0]._id,
      _to: meta._id,
      type: "makes_post"
    })
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(post, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: post._key})
  ));
  res.send(post);
}, 'create')
.body(Post, 'The post to create.')
.response(201, Post, 'The created post.')
.error(HTTP_CONFLICT, 'The post already exists.')
.summary('Create a new post')
.description(dd`
  Creates a new post from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let post
  try {
    post = PostItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(post);
}, 'detail')
.pathParam('key', keySchema)
.response(Post, 'The post.')
.summary('Fetch a post')
.description(dd`
  Retrieves a post by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const post = req.body;
  let meta;
  try {
    meta = PostItems.replace(key, post);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(post, meta);
  res.send(post);
}, 'replace')
.pathParam('key', keySchema)
.body(Post, 'The data to replace the post with.')
.response(Post, 'The new post.')
.summary('Replace a post')
.description(dd`
  Replaces an existing post with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let post;
  try {
    PostItems.update(key, patchData);
    post = PostItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(post);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the post with.'))
.response(Post, 'The updated post.')
.summary('Update a post')
.description(dd`
  Patches a post with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  const item = PostItems.document(key);
  try {
    query`
      for v,e in 1 outbound ${item} graph "student-connect"
      filter e.type == "post_has_comment"
      remove v in api_Comment
    `;

    query`
      for v,e in 1 any ${item} graph "student-connect"
      remove e in api_Relation 
    `;

    PostItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a post')
.description(dd`
  Deletes a post from the database.
`);


router.post("likeunlike", (req, res) => {
  const post = PostItems.document(req.body.post_id);
  const user = UserItems.firstExample({
    username: req.body.username
  });

  const dynamicQuery = aql.literal(`
    ${
      req.body.like ? 
        `
          INSERT {_from: v._id, _to: "${post._id}", type: "likes_post"} INTO api_Relation
        `
        :`
          for rel in api_Relation
            filter rel._from == v._id && rel.type == "likes_post" && rel._to == "api_Post/${req.body.post_id}"
            REMOVE rel in api_Relation
        `
    }
  `)
  const result = query`
    for v,e in 1 outbound ${user} graph "student-connect"
      filter e.type == "points_to"
      ${dynamicQuery}
  `;

  const likes = query`
    for v,e in 1 inbound ${post} graph "student-connect"
      filter e.type == "likes_post"
      return v
  `.toArray();
  res.send({success: true, likes})

}, 'likeunlike')
.body(joi.object({
  post_id: joi.string().required(),
  username: joi.string().required(),
  like: joi.boolean().required(),
}).required(), 'linking')
.description("like unlike post");




router.post("getpostdetail", (req, res) => {
  const post = getPostById(req.body.post_key);

  res.send({
    success: true,
    result: post,
  });

}, 'getfeed')
.body(joi.object({
  post_key: joi.string().required(),
}).required(), 'linking')
.description("get user feed");




router.post("getfeed", (req, res) => {
  const user = UserItems.firstExample({
    username: req.body.username
  });

  const student =  query`
  for v,e in 1 outbound ${user} graph "student-connect"
    filter e.type == "points_to"
    return v`.toArray();
  
  const friends = getFriends(user);
  let posts = [];
  for (let friend of student.concat(friends)) {
    const post = getPosts(friend);
    posts = posts.concat(post);
  }

  res.send({
    success: true,
    result: posts
  });

}, 'getfeed')
.body(joi.object({
  username: joi.string().required(),
}).required(), 'linking')
.description("get user feed");

