'use strict';
const db = require('@arangodb').db;

const documentCollections = [
  "Student",
  "School",
  "Topic",
  "Post",
  "Comment",
  "User",
  "Session"
];
const edgeCollections = [
  "Relation"
];

for (const localName of documentCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createDocumentCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.debug(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}

for (const localName of edgeCollections) {
  const qualifiedName = module.context.collectionName(localName);
  if (!db._collection(qualifiedName)) {
    db._createEdgeCollection(qualifiedName);
  } else if (module.context.isProduction) {
    console.debug(`collection ${qualifiedName} already exists. Leaving it untouched.`)
  }
}

const users = module.context.collectionName('User');
db._collection(users).ensureIndex({
  type: 'hash',
  fields: ['username'],
  unique: true
});



const graph_module = require("@arangodb/general-graph");
const edgeDefinitions = [ {
  collection: `api_${edgeCollections[0]}`,
  "from": documentCollections.map(item => `api_${item}`),
  "to" : documentCollections.map(item => `api_${item}`),
} ];
graph_module._create("student-connect", edgeDefinitions);