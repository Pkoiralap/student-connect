'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Commnet = require('../models/commnet');

const Commnets = module.context.collection('Commnets');
const keySchema = joi.string().required()
.description('The key of the commnet');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('commnet');


router.get(function (req, res) {
  res.send(Commnets.all());
}, 'list')
.response([Commnet], 'A list of Commnets.')
.summary('List all Commnets')
.description(dd`
  Retrieves a list of all Commnets.
`);


router.post(function (req, res) {
  const commnet = req.body;
  let meta;
  try {
    meta = Commnets.save(commnet);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(commnet, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: commnet._key})
  ));
  res.send(commnet);
}, 'create')
.body(Commnet, 'The commnet to create.')
.response(201, Commnet, 'The created commnet.')
.error(HTTP_CONFLICT, 'The commnet already exists.')
.summary('Create a new commnet')
.description(dd`
  Creates a new commnet from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let commnet
  try {
    commnet = Commnets.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(commnet);
}, 'detail')
.pathParam('key', keySchema)
.response(Commnet, 'The commnet.')
.summary('Fetch a commnet')
.description(dd`
  Retrieves a commnet by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const commnet = req.body;
  let meta;
  try {
    meta = Commnets.replace(key, commnet);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(commnet, meta);
  res.send(commnet);
}, 'replace')
.pathParam('key', keySchema)
.body(Commnet, 'The data to replace the commnet with.')
.response(Commnet, 'The new commnet.')
.summary('Replace a commnet')
.description(dd`
  Replaces an existing commnet with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let commnet;
  try {
    Commnets.update(key, patchData);
    commnet = Commnets.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(commnet);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the commnet with.'))
.response(Commnet, 'The updated commnet.')
.summary('Update a commnet')
.description(dd`
  Patches a commnet with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    Commnets.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a commnet')
.description(dd`
  Deletes a commnet from the database.
`);
