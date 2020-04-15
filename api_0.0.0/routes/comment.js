'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const query = require("@arangodb").query;
const aql = require("@arangodb").aql;
const createRouter = require('@arangodb/foxx/router');
const Comment = require('../models/comment');

const UserItems = module.context.collection('User');
const RelationItems = module.context.collection('Relation');
const CommentItems = module.context.collection('Comment');
const keySchema = joi.string().required()
.description('The key of the comment');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('comment');


router.get(function (req, res) {
  res.send(CommentItems.all());
}, 'list')
.response([Comment], 'A list of CommentItems.')
.summary('List all CommentItems')
.description(dd`
  Retrieves a list of all CommentItems.
`);


router.post(function (req, res) {
  const {post_key, username, ...comment } = req.body;
  let meta;
  try {
    meta = CommentItems.save(comment);
    let user = UserItems.firstExample({
      username: req.body.username
    });

    const student = query`
      for v,e in 1 outbound ${user} graph "student-connect"
      filter e.type == "points_to" 
      return v
    `.toArray();

    const meta1 = RelationItems.save({
      _from: `api_Post/${post_key}`,
      _to: meta._id,
      type: "post_has_comment"
    })

    const meta2 = RelationItems.save({
      _from: student[0]._id,
      _to: meta._id,
      type: "makes_comment"
    })
    console.log(meta1,meta2);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(comment, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: comment._key})
  ));
  res.send(comment);
}, 'create')
.body(Comment, 'The comment to create.')
.response(201, Comment, 'The created comment.')
.error(HTTP_CONFLICT, 'The comment already exists.')
.summary('Create a new comment')
.description(dd`
  Creates a new comment from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let comment
  try {
    comment = CommentItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(comment);
}, 'detail')
.pathParam('key', keySchema)
.response(Comment, 'The comment.')
.summary('Fetch a comment')
.description(dd`
  Retrieves a comment by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const comment = req.body;
  let meta;
  try {
    meta = CommentItems.replace(key, comment);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(comment, meta);
  res.send(comment);
}, 'replace')
.pathParam('key', keySchema)
.body(Comment, 'The data to replace the comment with.')
.response(Comment, 'The new comment.')
.summary('Replace a comment')
.description(dd`
  Replaces an existing comment with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let comment;
  try {
    CommentItems.update(key, patchData);
    comment = CommentItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(comment);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the comment with.'))
.response(Comment, 'The updated comment.')
.summary('Update a comment')
.description(dd`
  Patches a comment with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  const item = CommentItems.document(key)
  try {
    query`
      for v,e in 1 any ${item} graph "student-connect"
      remove e in api_Relation 
    `;
    CommentItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a comment')
.description(dd`
  Deletes a comment from the database.
`);



router.post("likeunlike", (req, res) => {
  const comment = CommentItems.document(req.body.comment_id);
  const user = UserItems.firstExample({
    username: req.body.username
  });

  const dynamicQuery = aql.literal(`
    ${
      req.body.like ? 
        `
          INSERT {_from: v._id, _to: "${comment._id}", type: "likes_comment"} INTO api_Relation
        `
        :`
          for rel in api_Relation
            filter rel._from == v._id && rel.type == "likes_comment" && rel._to == "api_Comment/${req.body.comment_id}"
            REMOVE rel in api_Relation
        `
    }
  `)
  query`
    for v,e in 1 outbound ${user} graph "student-connect"
      filter e.type == "points_to"
      ${dynamicQuery}
  `;
  
  const likes = query`
    for v,e in 1 inbound ${comment} graph "student-connect"
      filter e.type == "likes_comment"
      return v
  `.toArray();
  res.send({success: true, likes})

}, 'likeunlike')
.body(joi.object({
  comment_id: joi.string().required(),
  username: joi.string().required(),
  like: joi.boolean().required(),
}).required(), 'linking')
.description("like unlike post");