'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const School = require('../models/school');

const SchoolItems = module.context.collection('School');
const keySchema = joi.string().required()
.description('The key of the school');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('school');


router.get(function (req, res) {
  res.send(SchoolItems.all());
}, 'list')
.response([School], 'A list of SchoolItems.')
.summary('List all SchoolItems')
.description(dd`
  Retrieves a list of all SchoolItems.
`);


router.post(function (req, res) {
  const school = req.body;
  let meta;
  try {
    meta = SchoolItems.save(school);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(school, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: school._key})
  ));
  res.send(school);
}, 'create')
.body(School, 'The school to create.')
.response(201, School, 'The created school.')
.error(HTTP_CONFLICT, 'The school already exists.')
.summary('Create a new school')
.description(dd`
  Creates a new school from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let school
  try {
    school = SchoolItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(school);
}, 'detail')
.pathParam('key', keySchema)
.response(School, 'The school.')
.summary('Fetch a school')
.description(dd`
  Retrieves a school by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const school = req.body;
  let meta;
  try {
    meta = SchoolItems.replace(key, school);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(school, meta);
  res.send(school);
}, 'replace')
.pathParam('key', keySchema)
.body(School, 'The data to replace the school with.')
.response(School, 'The new school.')
.summary('Replace a school')
.description(dd`
  Replaces an existing school with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let school;
  try {
    SchoolItems.update(key, patchData);
    school = SchoolItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(school);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the school with.'))
.response(School, 'The updated school.')
.summary('Update a school')
.description(dd`
  Patches a school with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    SchoolItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a school')
.description(dd`
  Deletes a school from the database.
`);
