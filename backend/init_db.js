const arangodb = require('arangojs');
const config = require('./db_config');


const db = new arangodb.Database(config.url);
const init = async () => {
    try {
        await db.createDatabase(config.database_name)
    } catch(err) {
        // do nothing
    }
}


init()