'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Post = require('../models/post');

const Posts = module.context.collection('Posts');
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
  res.send(Posts.all());
}, 'list')
.response([Post], 'A list of Posts.')
.summary('List all Posts')
.description(dd`
  Retrieves a list of all Posts.
`);


router.post(function (req, res) {
  const post = req.body;
  let meta;
  try {
    meta = Posts.save(post);
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
    post = Posts.document(key);
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
    meta = Posts.replace(key, post);
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
    Posts.update(key, patchData);
    post = Posts.document(key);
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
  try {
    Posts.remove(key);
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
