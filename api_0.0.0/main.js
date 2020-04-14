'use strict';

module.context.use('/student', require('./routes/student'), 'student');
module.context.use('/school', require('./routes/school'), 'school');
module.context.use('/topic', require('./routes/topic'), 'topic');
module.context.use('/post', require('./routes/post'), 'post');
module.context.use('/comment', require('./routes/comment'), 'comment');
module.context.use('/user', require('./routes/user'), 'user');
module.context.use('/relation', require('./routes/relation'), 'relation');
