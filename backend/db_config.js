const STUDENT = 'api_Student';
const COMMENT = 'api_Comment';
const POST = 'api_Post';
const SCHOOL = 'api_School';
const RELATION = 'api_Relation';
const TOPIC = 'api_Topic';
const USER = 'api_User';


const collections = {
    [STUDENT.split("api_")[1]]: STUDENT,
    [COMMENT.split("api_")[1]]: COMMENT,
    [POST.split("api_")[1]]: POST,
    [SCHOOL.split("api_")[1]]: SCHOOL,
    [RELATION.split("api_")[1]]: RELATION,
    [USER.split("api_")[1]]: USER,
    [TOPIC.split("api_")[1]]: TOPIC,
}


const config = {
    url: 'http://localhost:8529',
    username: 'root',
    password: '',
    database_name: 'student_connect',
    collections
}

module.exports = config;
