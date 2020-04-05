const STUDENT = 'Student';
const COMMENT = 'Comments';
const POST = 'Posts';
const SCHOOL = 'School';
const RELATION = 'Relations';


const collections = [
    STUDENT,
    COMMENT,
    POST,
    SCHOOL,
    RELATION
]


const config = {
    url: 'http://localhost:8529',
    username: 'root',
    password: '',
    database_name: 'student_connect',
    collections
}

exports.config = config;