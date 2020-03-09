'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Person = require('../models/person');

const PersonItems = module.context.collection('Person');
const keySchema = joi.string().required()
.description('The key of the person');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('person');


router.get(function (req, res) {
  res.send(PersonItems.all());
}, 'list')
.response([Person], 'A list of PersonItems.')
.summary('List all PersonItems')
.description(dd`
  Retrieves a list of all PersonItems.
`);


router.post(function (req, res) {
  const person = req.body;
  let meta;
  try {
    meta = PersonItems.save(person);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(person, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: person._key})
  ));
  res.send(person);
}, 'create')
.body(Person, 'The person to create.')
.response(201, Person, 'The created person.')
.error(HTTP_CONFLICT, 'The person already exists.')
.summary('Create a new person')
.description(dd`
  Creates a new person from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let person
  try {
    person = PersonItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(person);
}, 'detail')
.pathParam('key', keySchema)
.response(Person, 'The person.')
.summary('Fetch a person')
.description(dd`
  Retrieves a person by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const person = req.body;
  let meta;
  try {
    meta = PersonItems.replace(key, person);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(person, meta);
  res.send(person);
}, 'replace')
.pathParam('key', keySchema)
.body(Person, 'The data to replace the person with.')
.response(Person, 'The new person.')
.summary('Replace a person')
.description(dd`
  Replaces an existing person with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let person;
  try {
    PersonItems.update(key, patchData);
    person = PersonItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(person);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the person with.'))
.response(Person, 'The updated person.')
.summary('Update a person')
.description(dd`
  Patches a person with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    PersonItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a person')
.description(dd`
  Deletes a person from the database.
`);
