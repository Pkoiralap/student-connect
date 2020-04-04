// Example of a random student generator for student-connect
var faker = require('faker'); // Faker.js
const uuid = require('uuid').v4;
var Database = require('arangojs').Database;

const db = new Database({
    url: "http://localhost:8529"
});
db.useDatabase("student_connect");
db.useBasicAuth("root", "");

var studentCollection = db.collection('Student');
var schoolCollection = db.collection('School');
var topicCollection = db.collection('Topic');
var postCollection = db.collection('Posts');
var commentCollection = db.collection('Comments');

// Create student collection
//need to add -> if collection not created already, then create 
var students = []
for (let step = 0; step < 500; step++) {
    student_id = uuid();
    students.push(student_id);
    student = {
        student_id: student_id, // unique id // searching for it // UUIDV4 use?
        student_name: faker.name.findName(),
        student_DOB: faker.date.between('1980-01-01', '2000-12-29'), // need to give some random dates from a range
        student_sex: faker.random.arrayElement(["M", "F"]), // male or female

        student_address: {
            street: faker.address.streetAddress(),
            city: faker.address.city(),
            state: faker.address.state(),
        },
        student_level: faker.random.arrayElement(["Undergraduate", "Graduate"]), // undergraduate/ graduate 
    };
    studentCollection.save(student).then(
        meta => console.log('Document saved:', meta._rev),
        err => console.error('Failed to save document:', err)
    );
};


var schools = []
for (let step = 0; step < 100;) {
    randomState = faker.address.state()
    randomCity = faker.address.city()
    randomStreet = faker.address.streetName()
    randomColUn = random.arrayElement(["College", "School", "Institute"]);
    randomUniversity = 'University of' + randomState + 'at' + randomCity;
    randomCollege = randomStreet + randomColUn;
    var school_id = uuid();
    schools.push(school_id);
    school = {
        school_id: uuid(),
        school_name: faker.random.arrayElement([randomUniversity, randomCollege]),
        school_address: {
            street: faker.address.streetAddress(),
            city: randomCity,
            state: randomState,
        },
    };
    schoolCollection.save(school).then(
        meta => console.log('Document saved:', meta._rev),
        err => console.error('Failed to save document:', err)
    );
};

// topics
var topics = []
for (let step = 0; step < 10; step++) {
    suffix = random.arrayElement(["Systems", "Management", "Science", "Organization", "Security", "Networks", "Security", "Architecture"]);
    prefix = random.arrayElement(["Computer", "Compiler", "Database"]);
    subject = prefix + suffix;
    languages = ["Python", "Haskell", "JavaScript", "Java", "C++", "C", "Perl", "SQL", "Ruby", "Scala", "F#", "C#", ".NET"];
    title = random.arrayElement([languages, subject]);
    topic_id = uuid();
    topics.push(topic_id);
    topic = {
        topic_id: topic_id,
        topic_text: title,

    };
    topicCollection.save(topic).then(
        meta => console.log('Document saved:', meta._rev),
        err => console.error('Failed to save document:', err)
    );
};

var posts = []
for (let step = 0; step < 10; step++) {
    post_id = uuid();
    posts.push(post_id);
    post = {
        post_id: post_id,
        post_text: faker.lorem.paragraph()
    };
    postCollection.save(post).then(
        meta => console.log('Document saved:', meta._rev),
        err => console.error('Failed to save document:', err)
    );
};

var comments = []
for (let step = 0; step < 10; step++) {
    comment_id = uuid();
    comments.push(comment_id);
    comment = {
        comment_id: comment_id,
        comment_text: faker.lorem.sentence()
    };
    commentCollection.save(comment).then(
        meta => console.log('Document saved:', meta._rev),
        err => console.error('Failed to save document:', err)
    );
};



// need to create relations
// k k seed wala kura bhandaithyo