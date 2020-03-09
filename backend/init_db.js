const arangodb = require('arangojs');
const config = require('./db_config').config;

const db = new arangodb.Database(config.url);

const createCollection = async () => {
    await Promise.all(config.collections.map(async collection => {
        try {
            let col = db.collection(collection);
            if (collection == 'Relations') {
                col = db.edgeCollection(collection);
            }
            return await col.create();
        } catch (err) {
            // do nothing
            console.log(err.message)
            return Promise.resolve();
        }
    }));
}

const init = async () => {
    try {
        await db.createDatabase(config.database_name)
    } catch(err) {
        // do nothing
    }

    db.useDatabase(config.database_name);
    db.useBasicAuth(config.username, config.password);

    await createCollection();
}

init()
