'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Education = require('../models/education');

const EducationItems = module.context.collection('Education');
const keySchema = joi.string().required()
.description('The key of the education');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('education');


router.get(function (req, res) {
  res.send(EducationItems.all());
}, 'list')
.response([Education], 'A list of EducationItems.')
.summary('List all EducationItems')
.description(dd`
  Retrieves a list of all EducationItems.
`);


router.post(function (req, res) {
  const education = req.body;
  let meta;
  try {
    meta = EducationItems.save(education);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(education, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: education._key})
  ));
  res.send(education);
}, 'create')
.body(Education, 'The education to create.')
.response(201, Education, 'The created education.')
.error(HTTP_CONFLICT, 'The education already exists.')
.summary('Create a new education')
.description(dd`
  Creates a new education from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let education
  try {
    education = EducationItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(education);
}, 'detail')
.pathParam('key', keySchema)
.response(Education, 'The education.')
.summary('Fetch a education')
.description(dd`
  Retrieves a education by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const education = req.body;
  let meta;
  try {
    meta = EducationItems.replace(key, education);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(education, meta);
  res.send(education);
}, 'replace')
.pathParam('key', keySchema)
.body(Education, 'The data to replace the education with.')
.response(Education, 'The new education.')
.summary('Replace a education')
.description(dd`
  Replaces an existing education with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let education;
  try {
    EducationItems.update(key, patchData);
    education = EducationItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(education);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the education with.'))
.response(Education, 'The updated education.')
.summary('Update a education')
.description(dd`
  Patches a education with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    EducationItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a education')
.description(dd`
  Deletes a education from the database.
`);
