const PERSON = 'Person';
const COMMENTS = 'Comments';
const POSTS = 'Posts';
const EDUCATION = 'Education';
const RELATION = 'Relations';


const collections = [
    PERSON,
    COMMENTS,
    POSTS,
    EDUCATION,
    RELATION
]


const config =  {
    url: 'http://localhost:8529',
    username: 'root',
    password: '',
    database_name: 'student_connect',
    collections
}

exports.config = config;
