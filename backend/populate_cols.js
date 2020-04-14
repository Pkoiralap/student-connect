// Example of a random collection ( vertices and edges) for student-connect
const faker = require('faker'); // Faker.js
const uuid = require('uuid').v4;
const arangodb = require('arangojs');
const config = require('./db_config');

const db = new arangodb.Database({
    url: config.url
});
db.useDatabase(config.database_name);
db.useBasicAuth(config.username, config.password);

const {
    Student,
    School,
    Topic,
    Post,
    Comment,
    Relation,
    User,
} = config.collections;

const studentCollection = db.collection(Student);
const schoolCollection = db.collection(School);
const topicCollection = db.collection(Topic);
const postCollection = db.collection(Post);
const commentCollection = db.collection(Comment);
const userCollection = db.collection(User);


const save = async (col, data) => {
    const test = new Error().stack;
    return col.save(data).then(
        meta => console.log('Document saved:', meta._id),
        err => console.error('Failed to save document:', err.message, test)
    )
};

const students = []
for (let step = 0; step < 1000; step++) {
    const student_id = uuid();
    students.push(student_id);
    const student = {
        _key: student_id,
        student_name: faker.name.findName(),
        student_DOB: faker.date.between('1980-01-01', '2000-12-29'),
        student_sex: faker.random.arrayElement(['M', 'F']), // male or female
        student_address: {
            street: faker.address.streetAddress(),
            city: faker.address.city(),
            state: faker.address.state(),
        },
        student_level: faker.random.arrayElement(['Undergraduate', 'Graduate']), // undergraduate/ graduate 
    };

    save(studentCollection, student);
};


const schools = []
for (let step = 0; step < 1000; step++) {
    const randomState = faker.address.state()
    const randomCity = faker.address.city()
    const randomStreet = faker.address.streetName()
    const randomColUn = faker.random.arrayElement(['College', 'School', 'Institute']);
    const randomUniversity = 'University of ' + randomState + ' at ' + randomCity;
    const randomCollege = randomStreet + " " + randomColUn;
    const school_id = uuid();
    schools.push(school_id);
    const school = {
        _key: school_id,
        school_name: faker.random.arrayElement([randomUniversity, randomCollege]),
        school_address: {
            street: faker.address.streetAddress(),
            city: randomCity,
            state: randomState,
        },
    };
    save(schoolCollection, school);
};

// topics
const topics = []

const suffix = ['Systems', 'Management', 'Science', 'Organization', 'Security', 'Networks', 'Security', 'Architecture'];
const prefix = ['Computer', 'Compiler', 'Database']

for (let pr of prefix) {
    for (let suf of suffix) {
        const topic_id = uuid();
        topics.push(topic_id);
        const topic = {
            _key: topic_id,
            topic_text: pr +  " " + suf,
        }
        save(topicCollection, topic);
    }
};
const languages = ['Python', 'Haskell', 'JavaScript', 'Java', 'C++', 'C', 'Perl', 'SQL', 'Ruby', 'Scala', 'F#', 'C#', '.NET'];
for (let lan of languages) {
    const topic_id = uuid();
    topics.push(topic_id);
    const topic = {
        _key: topic_id,
        topic_text: lan,
    }
    save(topicCollection, topic);
}


const posts = []
for (let step = 0; step < 1000; step++) {
    const post_id = uuid();
    posts.push(post_id);
    const post = {
        _key: post_id,
        post_text: faker.lorem.paragraph()
    };
    save(postCollection, post);
};

const comments = []
for (let step = 0; step < 1000; step++) {
    const comment_id = uuid();
    comments.push(comment_id);
    const comment = {
        _key: comment_id,
        comment_text: faker.lorem.sentence()
    };
    save(commentCollection, comment);
};

const relation = db.edgeCollection(Relation);
for (let i = 0; i < 1000; i++) {
    // Friend relation
    const from = `${Student}/${faker.random.arrayElement(students)}`;
    const to = `${Student}/${faker.random.arrayElement(students)}`;

    save(relation, {
        type: 'friend',
        _from: from,
        _to: to,
    });
    save(relation, {
        type: 'friend',
        _from: to,
        _to: from,
    });

    // makes_most relation
    save(relation, {
        type: 'makes_post',
        _from: `${Student}/${faker.random.arrayElement(students)}`,
        _to: `${Post}/${faker.random.arrayElement(posts)}`,
    });

    // interested in relation 
    save(relation, {
        type: 'interested_in',
        _from: `${Student}/${faker.random.arrayElement(students)}`,
        _to: `${Topic}/${faker.random.arrayElement(topics)}`,
    });

    // likes_post relation
    save(relation, {
        type: 'likes_post',
        _from: `${Student}/${faker.random.arrayElement(students)}`,
        _to: `${Post}/${faker.random.arrayElement(posts)}`,
    });
    
    const comment = `${Comment}/${faker.random.arrayElement(comments)}`;
    // posts has comment relation
    save(relation, {
        type: 'post_has_comment',
        _from: `${Post}/${faker.random.arrayElement(posts)}`,
        _to: comment,
    });

      // makes_comment relation    
    save(relation, {
        type: 'makes_comment',
        _from: `${Student}/${faker.random.arrayElement(students)}`,
        _to: comment,
    });

    // likes_comment relation
    save(relation, {
        type: 'likes_comment',
        _from: `${Student}/${faker.random.arrayElement(students)}`,
        _to: `${Comment}/${faker.random.arrayElement(comments)}`,
    });
};

for (let std of students) {
    save(relation, {
        type: 'studies_in',
        _from: `${Student}/${std}`,
        _to: `${School}/${faker.random.arrayElement(schools)}`,
    });
}

