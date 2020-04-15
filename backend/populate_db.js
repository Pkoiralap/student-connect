// Example of a random collection ( vertices and edges) for student-connect
var faker = require('faker'); // Faker.js
const uuid = require('uuid').v4;
var arangodb = require('arangojs');

const db = new arangodb.Database({
    url: "http://localhost:8529"
});
db.useDatabase("student_connect");
db.useBasicAuth("root", "");

var studentCollection = db.collection('Student');
var schoolCollection = db.collection('School');
var topicCollection = db.collection('Topic');
var postCollection = db.collection('Posts');
var commentCollection = db.collection('Comments');

var students = []
for (let step = 0; step < 10; step++) {
    student_id = uuid();
    students.push(student_id);
    student = {
        _key: student_id,
        student_id: student_id, // unique id // searching for it // UUIDV4 use?
        student_name: faker.name.findName(),
        student_DOB: faker.date.between('1980-01-01', '2000-12-29'),
        student_sex: faker.random.arrayElement(["M", "F"]), // male or female

        student_address: {
            street: faker.address.streetAddress(),
            city: faker.address.city(),
            state: faker.address.state(),
        },
        student_level: faker.random.arrayElement(["Undergraduate", "Graduate"]), // undergraduate/ graduate 
    };

    studentCollection.save(student).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );
};


var schools = []
for (let step = 0; step < 10; step++) {
    randomState = faker.address.state()
    randomCity = faker.address.city()
    randomStreet = faker.address.streetName()
    randomColUn = faker.random.arrayElement(["College", "School", "Institute"]);
    randomUniversity = 'University of' + randomState + 'at' + randomCity;
    randomCollege = randomStreet + randomColUn;
    var school_id = uuid();
    schools.push(school_id);
    school = {
        _key: school_id,
        school_id: school_id,
        school_name: faker.random.arrayElement([randomUniversity, randomCollege]),
        school_address: {
            street: faker.address.streetAddress(),
            city: randomCity,
            state: randomState,
        },
    };
    schoolCollection.save(school).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );
};

// topics
var topics = []
for (let step = 0; step < 10; step++) {
    suffix = faker.random.arrayElement(["Systems", "Management", "Science", "Organization", "Security", "Networks", "Security", "Architecture"]);
    prefix = faker.random.arrayElement(["Computer", "Compiler", "Database"]);
    subject = prefix + suffix;
    languages = ["Python", "Haskell", "JavaScript", "Java", "C++", "C", "Perl", "SQL", "Ruby", "Scala", "F#", "C#", ".NET"];
    title = faker.random.arrayElement([languages, subject]);
    topic_id = uuid();
    topics.push(topic_id);
    topic = {
        _key: topic_id,
        topic_id: topic_id,
        topic_text: title,

    };
    topicCollection.save(topic).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );
};

var posts = []
for (let step = 0; step < 10; step++) {
    post_id = uuid();
    posts.push(post_id);
    post = {
        _key: post_id,
        post_id: post_id,
        post_text: faker.lorem.paragraph()
    };
    postCollection.save(post).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );
};

var comments = []
for (let step = 0; step < 10; step++) {
    comment_id = uuid();
    comments.push(comment_id);
    comment = {
        _key: comment_id,
        comment_id: comment_id,
        comment_text: faker.lorem.sentence()
    };
    commentCollection.save(comment).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );
};

const relations = db.edgeCollection('Relations');
for (let i = 0; i < 10; i++) {
    // Friend relation
    relations.save({
        Type: "Friend",
        _from: "Student/" + faker.random.arrayElement(students),
        _to: "Student/" + faker.random.arrayElement(students),
    }).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );

    // makes_most relation
    relations.save({
        Type: "makes_post",
        _from: "Student/" + faker.random.arrayElement(students),
        _to: "Post/" + faker.random.arrayElement(posts),
    }).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );

    // makes_comment relation    
    relations.save({
        Type: "makes_comment",
        _from: "Student/" + faker.random.arrayElement(students),
        _to: "Comment/" + faker.random.arrayElement(comments),
    }).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );

    // interested in relation 
    relations.save({
        Type: "interested_in",
        _from: "Student/" + faker.random.arrayElement(students),
        _to: "Topic/" + faker.random.arrayElement(topics),
    }).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );

    // posts has comment relation
    relations.save({
        Type: "post_has_comment",
        _from: "Post/" + faker.random.arrayElement(posts),
        _to: "Comment/" + faker.random.arrayElement(comments),
    }).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );
    // likes_post relation
    relations.save({
        Type: "likes_post",
        _from: "Student/" + faker.random.arrayElement(students),
        _to: "Post/" + faker.random.arrayElement(posts),
    }).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );

    // likes_comment relation
    relations.save({
        Type: "likes_comment",
        _from: "Student/" + faker.random.arrayElement(students),
        _to: "Comment/" + faker.random.arrayElement(comments),
    }).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );

    relations.save({
        Type: "studies_in",
        _from: "Student/" + faker.random.arrayElement(students),
        _to: "School/" + faker.random.arrayElement(schools),
    }).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err)
    );
};




// pseudocode to create graph

// const existence = graph.exists();


// if (existence == false) {

// graph.create('Relationships');
// graph = db.graph('Relationships');
// };


// const graph = db.graph('Relations')
// const info = graph.create(edges).then(
//     graph => graph
// ).catch(err => console.log(err));
// collection('Relations').save({from: 'Person/{key}', to: 'Post/{key}', type: "likesPost"})

// graph.addVertexCollection(studentCollection);
// graph.addVertexCollection(schoolCollection);
// graph.addVertexCollection(topicCollection);
// graph.addVertexCollection(postCollection);
// graph.addVertexCollection(commentCollection);

// graph.addEdgeDefinition({
//     collection: "Friend",
//     from: "Student",
//     to: "Student"
// });