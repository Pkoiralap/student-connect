'use strict';
const _ = require('lodash');
const joi = require('joi');

module.exports = {
  schema: {
    // Describe the attributes with joi here
    _key: joi.string(),
    student_name: joi.string(),
    student_DOB: joi.date(),
    student_sex: joi.string().allow(["M", "F"]),
    student_address: joi.object({
      street: joi.string(),
      city: joi.string(),
      state: joi.string(),
    }),
  },
  forClient(obj) {
    // Implement outgoing transformations here
    obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
    return obj;
  },
  fromClient(obj) {
    // Implement incoming transformations here
    return obj;
  }
};
