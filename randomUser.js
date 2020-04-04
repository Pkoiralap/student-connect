// Example of a random student generator for student-connect
var faker = require('faker'); // Faker.js
const uuid = require('uuid').v4;
var Database = require('arangojs').Database;


const db = new Database({
    url: "http://localhost:8529"
});
db.useDatabase("student_connect");
db.useBasicAuth("root", "");

var personCollection = db.collection('Person');


for (let step = 0; step < 500; step++) {
    person = {
        id: uuid(), // unique id // searching for it // UUIDV4 use?
        name: faker.name.findName(),
        DOB: faker.date.past(),
        sex: faker.random.arrayElement(["M", "F"]), // male or female

        address: {
            street: faker.address.streetAddress(),
            city: faker.address.city(),
            state: faker.address.state(),
        },
        Level: faker.random.arrayElement(["Undergraduate", "Graduate"]), // undergraduate/ graduate 
    };

    personCollection.save(person).then(
        meta => console.log('Document saved:', meta._rev),
        err => console.error('Failed to save document:', err)
    );
};