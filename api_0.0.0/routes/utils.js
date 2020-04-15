const query = require("@arangodb").query;
const aql = require("@arangodb").aql;

const getMutual = (user, student) => {
  let filter = aql.literal(
    `filter p.vertices[2]._id == "${student._id}"`
  )

  const mutual = query`
    for ver,edg in 1 outbound ${user} graph "student-connect"
      filter edg.type == "points_to"
      for v,e,p in 2 outbound ver graph "student-connect"
        filter e.type == "friend" && v._id != ver._id && length(p.edges) == 2
        ${filter}
        return p.vertices[1]
  `.toArray();

  return mutual;
}

const isfriend = (user, student) => {
  let filter = aql.literal(
    `filter v._id == "${student._id}"`
  )
  const isfriend = query`
    for ver,ed in 1 outbound ${user} graph "student-connect"
      filter ed.type == "points_to"
      for v,e in 1 outbound ver graph "student-connect"
        filter e.type == "friend"
        ${filter}
        return true
  `.toArray();

  return isfriend;
}

const getSchool = (student) => {
  const school = query`
    for v,e,p in 1 outbound ${student} graph "student-connect"
      filter e.type == "studies_in"
      return v
  `.toArray();
  
  return school;
}

const getTopics = (student) => {
  const topics = query`
    for v,e,p in 1 outbound ${student} graph "student-connect"
      filter e.type == "interested_in"
      return v
  `.toArray();
  
  return topics;
}

const getPostById = (postKey) => {
  const literal = aql.literal(`
    let v = document("api_Post/${postKey}")
  `)
  const postById = query`
    ${literal}
    return {
      post: v,
      likes_on_post: (
        for v1,e1 in 1 inbound v graph "student-connect"
          filter e1.type == "likes_post"
          return v1
      ),
      comments: (
        for v2,e2 in 1 outbound v graph "student-connect"
          filter e2.type == "post_has_comment"
          return {
            comment: v2,
            student: (
              for v4,e4 in 1 inbound v2 graph "student-connect"
                filter e4.type == "makes_comment"
                return v4
            ),
            likes_on_comment: (
              for v3,e3 in 1 inbound v2 graph "student-connect"
                filter e3.type == "likes_comment"
                return v3
            )
          }
      )
    }
  `.toArray();
  return postById[0];
}

const getPosts = (student) => {
  const postsMadeByStudent = query`
    for v,e,p in 1 outbound ${student} graph "student-connect"
      filter e.type == "makes_post"
      return {
        post: v,
        likes_on_post: (
          for v1,e1 in 1 inbound v graph "student-connect"
            filter e1.type == "likes_post"
            return v1
        ),
        comments: (
          for v2,e2 in 1 outbound v graph "student-connect"
            filter e2.type == "post_has_comment"
            return {
              comment: v2,
              student: (
                for v4,e4 in 1 inbound v2 graph "student-connect"
                  filter e4.type == "makes_comment"
                  return v4
              ),
              likes_on_comment: (
                for v3,e3 in 1 inbound v2 graph "student-connect"
                  filter e3.type == "likes_comment"
                  return v3
              )
            }
        )
      }
  `.toArray();
  return postsMadeByStudent.map(item => ({
    ...item,
    student,
  }));
}

const getFriends = (user) => {
  const friends = query`
    for v,e,p in 1 outbound ${user} graph "student-connect"
      filter e.type == "points_to"
      for v1,e1 in 1 outbound v graph "student-connect"
      filter e1.type == "friend"
      return v1
  `.toArray();
  
  return friends;
}


exports.getMutual = getMutual;
exports.getPosts = getPosts;
exports.getPostById = getPostById;
exports.getSchool = getSchool;
exports.getTopics = getTopics;
exports.isfriend = isfriend;
exports.getFriends = getFriends;
