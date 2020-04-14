'use strict';
const db = require('@arangodb').db;
const collections = [
  "Student",
  "School",
  "Topic",
  "Post",
  "Comment",
  "User",
  "Relation"
];

for (const localName of collections) {
  const qualifiedName = module.context.collectionName(localName);
  db._drop(qualifiedName);
}

const graph_module = require("@arangodb/general-graph");
graph_module._drop("student-connect");
