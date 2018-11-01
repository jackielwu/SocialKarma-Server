"use strict";

var path = require('path');
var firebase = require('../config/fire');
var database = firebase.database();

function calcGeo (lat, lng) {
    return new Promise(function(resolve, reject) {
        database.ref("geolocation").once("value", function (snapshot) {
            snapshot.forEach(function (entry) {
                if (entry.child("coord1/lat").val() >= lat
                    && entry.child("coord2/lat").val() <= lat
                    && entry.child("coord1/lng").val() <= lng
                    && entry.child("coord2/lng").val() >= lng
                ) {
                    resolve(entry.key);
                }
            });
            resolve(undefined);
        });
    });
}

exports.geo = async function(req, res) {
    var { lat, lng } = req. query;
    //40.424305, -86.913188
    var g = await calcGeo(lat, lng);
    if (g) {
      res.status(200).send({ geo: g });
    } else {
      res.status(400).send({ error: "The requested location is not currently provided." });
    }
    return;
};

/* GET */

exports.getPosts = function(req, res) {
    var { geolocation } = req.query;
    if (geolocation === undefined) {
        return res.status(400).send({ error: "Required parameters to query posts are missing."});
    } else {
        var ref = database.ref("posts");
        ref.orderByChild("geolocation").equalTo(geolocation).once("value", function(snapshot) {
            if (snapshot.exists()) {
              let response = snapshot.val();
              var posts = [];
              Object.keys(response).forEach(function(key, index) {
                var obj = {
                  postId: key,
                  title: response[key].title,
                  author: response[key].author,
                  authorName: response[key].authorName,
                  content: response[key].content,
                  upvoteCount: response[key].upvoteCount,
                  timestamp: response[key].timestamp,
                };
                if (response[key].comments) {
                  obj.commentCount = Object.keys(response[key].comments).length;
                }
                posts.push(obj);
              });
              res.status(200).send(posts);
            } else {
              res.status(500).send({ error: "Internal Server Error: Could not get posts."});
            }
        });
        return;
    }
};

exports.getPostComments = function(req, res) {
  var { postId } = req.body;
  var ref = database.ref("postComments");
  ref.orderByChild("postId").equalTo(postId).limitToLast(20).once("value", function(snapshot) {
    if (snapshot.exists()) {
      let response = snapshot.val();
      var comments = [];
      Object.keys(response).forEach(function(key, index) {
        var obj = {
          postCommentId: key,
          author: response[key].author,
          authorName: response[key].authorName,
          postId: response[key].postId,
          comment: response[key].comment,
          timestamp: response[key].timestamp,
          votes: response[key].votes
        };
        comments.push(obj);
      });
      res.status(200).send(comments);
    } else {
      res.status(400).send({ error: "Post does not have any comments." });
    }
  });
};

/* POST */

/**
 * Create new post
 */
exports.postNewPost = function(req, res) {
    var { location, author, content, title } = req.body;
    if (location === undefined || author === undefined || content === undefined || title === undefined) {
        return res.status(400).send({ error: "Required parameters to create a new post are missing."} );
    } else if (location["lat"] === undefined || location["lng"] === undefined) {
        return res.status(400).send({ error: "Invalid location parameter" });
    }
    let timestamp = Math.floor(Date.now() / 1000);
    database.ref("users").child(author).once("value", function(snapshot) {
        if (snapshot.exists()) {
          calcGeo(location["lat"], location["lng"]).then(function(g) {
            if (!g) {
              return res.status(400).send({ error: "The requested location is not currently provided." });
              return;
            }
              var newPost = {
                  geolocation: g,
                  title: title,
                  author: author,
                  authorName: snapshot.val().username,
                  content: content,
                  upvoteCount: 0,
                  commentCount: 0,
                  timestamp: timestamp
              };
              var newPostRef = database.ref("posts").push();
              var newPostKey = newPostRef.key;
              newPostRef.set(newPost, function(error) {
                  if (error) {
                      return res.status(500).send({ error: "Internal server error: Post could not be created."});
                  } else {
                    var newPostObj = {};
                    newPostObj[newPostKey] = true;
                    database.ref("users").child(author + "/posts").update(newPostObj);
                    return res.status(200).send({ message: "success" });
                  }
              });
          });
        } else {
            return res.status(400).send({ error: "User does not exist." });
        }
    });
};

exports.postPostComment = function(req, res) {
  var { userId, postId, comment } = req.body;
  let timestamp = Math.floor(Date.now() / 1000);
  database.ref("users").child(userId).once("value").then(function(userSnapshot) {
    if (userSnapshot.exists()) {
      database.ref("posts").child(postId).once("value").then(function(snapshot) {
        if (snapshot.exists()) {
          var postCommentRef = database.ref("postComments").push();
          var postCommentKey = postCommentRef.key;
          let commentsKey = "comments/" + postCommentKey;
          postCommentRef.set({
            "author": userId,
            "authorName": userSnapshot.val().username,
            "postId": postId,
            "comment": comment,
            "timestamp": timestamp,
            "votes": 0
          }, function(error) {
            if (error) {
              res.status(500).send({ error: "Internal server error: Comment could not be created for post." });
            } else {
              var newComment = {};
              newComment[commentsKey] = true;
              database.ref("posts").child(postId).update(newComment, function(error) {
                if (error) {
                  res.status(500).send({ error: "Internal server error: Comment could not be created for post." });
                } else {
                  database.ref("users").child(userId).update(newComment);
                  res.status(200).send({ message: "success" });
                }
              });
            }
          });
        } else {
          res.status(400).send({ error: "Post does not exist." });
        }
      });
    } else {
      res.status(400).send({ error: "User does not exist." });
    }
  });
};

exports.postPostVote = function(req, res) {
  var { userId, postId, vote } = req.body;
  database.ref("users").child(userId).once("value").then(function(userSnapshot) {
    if (userSnapshot.exists()) {
      database.ref("posts").child(postId).once("value").then(function(snapshot) {
        if (snapshot.exists()) {
          database.ref("posts").child(postId).update({
            "votes" : snapshot.val().votes + (vote == 0 ? -(userSnapshot.val()[userId].votes.posts[postId]) : vote)
          }, function(error) {
            if (error) {
              res.status(500).send({ error: "Coould not create reaction for post." });
            } else {
              const userVoteKey = "votes/posts/" + postId;
              var userVote = {};
              userVote[userVoteKey] = vote;
              database.ref("users/" + userId).update(userVote, function(error) {
                if (error) {
                  res.status(500).send({ error: "Internal server error: Could not create vote for post." });
                } else {
                  res.status(200).send({ message: "success" });
                }
              });
            }
          });
        } else {
          res.status(400).send({ error: "Post does not exist." });
        }
      });
    } else {
      res.status(400).send({ error: "User does not exist." });
    }
  });
}
