'use strict';

module.context.use('/commnets', require('./routes/commnets'), 'commnets');
module.context.use('/education', require('./routes/education'), 'education');
module.context.use('/posts', require('./routes/posts'), 'posts');
module.context.use('/person', require('./routes/person'), 'person');
module.context.use('/relations', require('./routes/relations'), 'relations');
