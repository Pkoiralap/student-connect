'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Relation = require('../models/relation');

const Relations = module.context.collection('Relations');
const keySchema = joi.string().required()
.description('The key of the relation');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('relation');


const NewRelation = Object.assign({}, Relation, {
  schema: Object.assign({}, Relation.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(Relations.all());
}, 'list')
.response([Relation], 'A list of Relations.')
.summary('List all Relations')
.description(dd`
  Retrieves a list of all Relations.
`);


router.post(function (req, res) {
  const relation = req.body;
  let meta;
  try {
    meta = Relations.save(relation._from, relation._to, relation);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(relation, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: relation._key})
  ));
  res.send(relation);
}, 'create')
.body(NewRelation, 'The relation to create.')
.response(201, Relation, 'The created relation.')
.error(HTTP_CONFLICT, 'The relation already exists.')
.summary('Create a new relation')
.description(dd`
  Creates a new relation from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let relation
  try {
    relation = Relations.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(relation);
}, 'detail')
.pathParam('key', keySchema)
.response(Relation, 'The relation.')
.summary('Fetch a relation')
.description(dd`
  Retrieves a relation by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const relation = req.body;
  let meta;
  try {
    meta = Relations.replace(key, relation);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(relation, meta);
  res.send(relation);
}, 'replace')
.pathParam('key', keySchema)
.body(Relation, 'The data to replace the relation with.')
.response(Relation, 'The new relation.')
.summary('Replace a relation')
.description(dd`
  Replaces an existing relation with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let relation;
  try {
    Relations.update(key, patchData);
    relation = Relations.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(relation);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the relation with.'))
.response(Relation, 'The updated relation.')
.summary('Update a relation')
.description(dd`
  Patches a relation with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    Relations.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a relation')
.description(dd`
  Deletes a relation from the database.
`);
