
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const query = require("@arangodb").query;
const aql = require("@arangodb").aql;
const createRouter = require('@arangodb/foxx/router');
const Student = require('../models/student');
const {
  getMutual,
  getPosts,
  getSchool,
  getTopics,
  isfriend,
} = require("./utils");


const StudentItems = module.context.collection('Student');
const RelationItems = module.context.collection('Relation');
const TopicItems = module.context.collection('Topic');
const SchoolItems = module.context.collection('School');
const UserItems = module.context.collection('User');

const keySchema = joi.string().required()
.description('The key of the student');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('student');
router.get(function (req, res) {
  res.send(StudentItems.all());
}, 'list')
.response([Student], 'A list of StudentItems.')
.summary('List all StudentItems')
.description(dd`
  Retrieves a list of all StudentItems.
`);


router.post(function (req, res) {
  const student = req.body;
  let meta;
  try {
    meta = StudentItems.save(student);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(student, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: student._key})
  ));
  res.send(student);
}, 'create')
.body(Student, 'The student to create.')
.response(201, Student, 'The created student.')
.error(HTTP_CONFLICT, 'The student already exists.')
.summary('Create a new student')
.description(dd`
  Creates a new student from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let student
  try {
    student = StudentItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(student);
}, 'detail')
.pathParam('key', keySchema)
.response(Student, 'The student.')
.summary('Fetch a student')
.description(dd`
  Retrieves a student by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const student = req.body;
  let meta;
  try {
    meta = StudentItems.replace(key, student);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(student, meta);
  res.send(student);
}, 'replace')
.pathParam('key', keySchema)
.body(Student, 'The data to replace the student with.')
.response(Student, 'The new student.')
.summary('Replace a student')
.description(dd`
  Replaces an existing student with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let student;
  try {
    StudentItems.update(key, patchData);
    student = StudentItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(student);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the student with.'))
.response(Student, 'The updated student.')
.summary('Update a student')
.description(dd`
  Patches a student with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    StudentItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a student')
.description(dd`
  Deletes a student from the database.
`);


router.post("changeschool", (req, res) => {
  const student_key = req.body.student_key;
  const student = StudentItems.document(student_key);
  const school = SchoolItems.firstExample({
    school_name: req.body.school_name,
  });

  let relation = RelationItems.firstExample({
    _from: student._id,
    type: "studies_in"
  })

  if (relation) {
    RelationItems.remove(relation._id) 
    relation._to = school._id;
  } else {
    relation = {
      _to: school._id,
      _from: student._id,
      type: "studies_in"
    }
  }

  const meta = RelationItems.save(relation)
  
  res.send({success: true, data: meta});
}, 'changeschool')
.body(joi.object({
  school_name: joi.string().required(),
  student_key: joi.string().required(),
}).required(), 'linking')
.description("Changed student's school");


router.post("changetopics", (req, res) => {
  const student_key = req.body.student_key;
  const topics = req.body.topics;
  const student = StudentItems.document(student_key);

  const old_relations = RelationItems.byExample({ 
    _from: student._id,
    type: "interested_in",
  }).toArray();

  for (let rel of old_relations) {
    try {
      RelationItems.remove(rel._key);
    } catch (err) {
      // do nothing if it can't be removed
    }
  }

  for (let topic of topics) {
    const t = TopicItems.firstExample({
      topic_text: topic,
    })
    RelationItems.save({
      _from: student._id,
      type: "interested_in",
      _to: t._id,
    });
  }

  res.send({success: true});

}, 'changetopics')
.body(joi.object({
  topics: joi.array().items(joi.string()).required(),
  student_key: joi.string().required(),
}).required(), 'linking')
.description("Changed student's topic");



router.post("search", (req, res) => {
  const user = UserItems.firstExample({
    username: req.body.username
  });

  const filter = aql.literal(
    req.body.name ? `FILTER like(st.student_name, "%${req.body.name}%", true)` : ''
  );
  const result = query`
    let userfriends = (
      for ver,ed in 1 outbound ${user} graph "student-connect"
      filter ed.type == "points_to"
          for v,e in 1 outbound ver graph "student-connect"
          filter e.type == "friend"
          return v._id
    )
    let user = (
      for ver,ed in 1 outbound ${user} graph "student-connect"
        filter ed.type == "points_to"
        return ver._id
    )

    for st in api_Student
        filter st._id not in user
        ${filter}
        let st_friends = (
            for v,e in 1 outbound st graph "student-connect"
            filter e.type == "friend"
            filter v._id != st._id
            return v._id
        )
        let mutual = (
            for id in INTERSECTION(userfriends, st_friends)
            return document(concat("api_Student/", id))
        )
        let isfriend = st._id IN userfriends
        SORT not isfriend, length(mutual) DESC
        return distinct merge(st, {mutual: mutual}, {isfriend: isfriend})

  `.toArray();

  res.send({success: true, result});

}, 'changetopics')
.body(joi.object({
  username: joi.string().required(),
  name: joi.string().allow(""),
}).required(), 'linking')
.description("Changed student's topic");


router.post("addfriend", (req, res) => {
  const user = UserItems.firstExample({
    username: req.body.username
  });

  const student = StudentItems.firstExample({
    _key: req.body.friend_key
  });

  const result = query`
    for ver,ed in 1 outbound ${user} graph "student-connect"
      filter ed.type == "points_to"
      INSERT {
        _from: ver._id,
        _to: ${student._id},
        type: "friend"
      } IN api_Relation
  `.toArray();

  res.send({success: true, result});

}, 'changetopics')
.body(joi.object({
  username: joi.string().required(),
  friend_key: joi.string().required(),
}).required(), 'linking')
.description("makefriend");



router.post("unfriend", (req, res) => {
  const user = UserItems.firstExample({
    username: req.body.username
  });

  const filter = aql.literal(
    `filter rel._from == ver._id && rel._to == "api_Student/${req.body.friend_key}"`
  );
  const result = query`
    for ver,ed in 1 outbound ${user} graph "student-connect"
      filter ed.type == "points_to"
      for rel in api_Relation
        ${filter}
        REMOVE rel IN api_Relation
  `.toArray();

  res.send({success: true, result});

}, 'changetopics')
.body(joi.object({
  username: joi.string().required(),
  friend_key: joi.string().required(),
}).required(), 'linking')
.description("remove friend");



router.post("getprofile", (req, res) => {
  const student = StudentItems.document(req.body.student_key);
  const user = UserItems.firstExample({
    username: req.body.username
  });

  const mutual = getMutual(user, student);
  const friend = isfriend(user, student);
  const school = getSchool(student);
  const posts = getPosts(student);
  const topics = getTopics(student);

  res.send({
    success: true,
    result: {
      mutual,
      isfriend: friend,
      school,
      posts,
      topics,
      student
    }});

}, 'changetopics')
.body(joi.object({
  username: joi.string().required(),
  student_key: joi.string().required(),
}).required(), 'linking')
.description("get user profile");

