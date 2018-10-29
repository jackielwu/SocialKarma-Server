var path = require('path');
var firebase = require('../config/fire');
var database = firebase.database();

/* GET */

/**
  Get list of meetups

  Default limit to 20 meetups per call
*/
exports.getMeetups = function(req, res) {
  var { endAt, userId } = req.query;
  var ref = database.ref("meetups");
  if (endAt === undefined) {
    ref.orderByChild("startTime").limitToLast(20).once("value", function(snapshot) {
      if (snapshot.exists()) {
        let response = snapshot.val();
        var meetups = [];
        Object.keys(response).forEach(function(key, index) {
          var obj = {
            meetupId: key,
            title: response[key].title,
            startTime: response[key].startTime,
            endTime: response[key].endTime,
            location: response[key].location,
            organizer: response[key].organizer,
            organizerName: response[key].organizerName,
          };
          if (response[key].shortDescription != undefined) {
            obj.shortDescription = response[key].shortDescription;
          }
          if (userId != undefined) {
            Object.keys(response[key].usersAttending).forEach(function(key, index) {
              if (key === userId) {
                obj.attending = true;
              }
            });
          }
          meetups.push(obj);
        });
        res.status(200).send(meetups);
      } else {
        res.status(500).send({ error: "Internal Server Error: Could not get meetups."});
      }
    });
  } else {
    ref.orderByChild("startTime").endAt(parseInt(endAt)).limitToLast(20).once("value", function(snapshot) {
      if (snapshot.exists()) {
        let response = snapshot.val();
        var meetups = [];
        Object.keys(response).forEach(function(key, index) {
          var obj = {
            meetupId: key,
            title: response[key].title,
            startTime: response[key].startTime,
            endTime: response[key].endTime,
            location: response[key].location,
            organizer: response[key].organizer,
            organizerName: response[key].organizerName,
          };
          if (response[key].shortDescription != undefined) {
            obj.shortDescription = response[key].shortDescription;
          }
          if (userId != undefined) {
            Object.keys(response[key].usersAttending).forEach(function(key, index) {
              if (key === userId) {
                obj.attending = true;
              }
            });
          }
          meetups.push(obj);
        });
        res.status(200).send(meetups);
      } else {
        res.status(400).send({ error: "Invalid endAt time."});
      }
    });
  }
}

/**
  Get detail for a specific meetup
*/
exports.getMeetupDetail = function(req, res) {
  var { meetupId } = req.params;
  var { userId } = req.query;
  var ref = database.ref("meetups");
  ref.child(meetupId).once("value", function(snapshot) {
    if (snapshot.exists()) {
      var promises = [];
      var obj = snapshot.val();
      Object.keys(snapshot.val().usersAttending).forEach(function(key, index) {
        promises.push(database.ref("users").child(key).once("value"));
        if (userId != undefined) {
          if (userId === key) {
            obj.attending = true;
          }
        }
      });
      Promise.all(promises).then(function(snapshots) {
        var users = [];
        snapshots.forEach(function(snap) {
          users.push(snap.val());
        });
        obj.usersAttending = users;
        obj.meetupId = meetupId;
        res.status(200).send(obj);
      });
    } else {
      res.status(404).send({ error: "Meetup not found." });
    }
  });
}

/**
  Get comments for a specific meetup

  Default limit to 20 meetups per call
*/
exports.getMeetupComments = function(req, res) {
  var { meetupId } = req.params;
  var ref = database.ref("meetupComments");
  ref.orderByChild("meetupId").equalTo(meetupId).limitToLast(20).once("value", function(snapshot) {
    if (snapshot.exists()) {
      let response = snapshot.val();
      var comments = [];
      Object.keys(response).forEach(function(key, index) {
        var obj = {
          meetupCommentId: key,
          author: response[key].author,
          authorName: response[key].authorName,
          meetupId: response[key].meetupId,
          comment: response[key].comment,
          timestamp: response[key].timestamp,
          votes: response[key].votes
        };
        comments.push(obj);
      });
      res.status(200).send(comments);
    } else {
      res.status(400).send({ error: "Meetup does not have any comments." });
    }
  });
}


/* POST */

/**
  Create new meetup
*/
exports.postNewMeetup = function(req, res) {
  var { title, startTime, endTime, location, organizer } = req.body;
  if (title === undefined || startTime === undefined || endTime === undefined || location === undefined || organizer === undefined) {
    res.status(400).send({ error: "Required parameters to create a new meetup are missing."} );
  } else if (location["coordinates"] === undefined) {
    res.status(400).send({ error: "Invalid location parameter" });
  } else if (location["coordinates"]["lat"] === undefined || location["coordinates"]["lng"] === undefined) {
    res.status(400).send({ error: "Invalid location parameter" });
  } else if (parseInt(startTime) == NaN || parseInt(endTime) == NaN || parseInt(startTime) > parseInt(endTime)) {
    res.status(400).send({ error: "Meetup ends before it starts." });
  }
  database.ref("users").child(organizer).once("value", function(snapshot) {
    if (snapshot.exists()) {
      var newMeetup = {
        "title": title,
        "startTime": startTime,
        "endTime": endTime,
        "location": location,
        "organizer": organizer,
        "organizerName": snapshot.val().username,
      }
      newMeetup["usersAttending"] = {};
      newMeetup["usersAttending"][organizer] = true;
      var { description } = req.body;
      if (description != undefined) {
        newMeetup.description = description;
        newMeetup.shortDescription = description.substring(0, 100);
      }
      var meetupRef = database.ref("meetups").push();
      meetupRef.set(newMeetup, function(error) {
        if (error) {
          res.status(500).send({ error: "Internal server error: Meetup could not be created."});
        } else {
          var meetupObj = {};
          meetupObj[meetupRef.key] = true;
          database.ref("users").child(organizer + "/meetupsAttending").update(meetupObj);
          res.status(200).send({ message: "success" });
        }
      });
    } else {
      res.status(400).send({ error: "User does not exist." });
    }
  });
}

/**
  RSVP to a specific meetup
*/
exports.postRsvpMeetup = function(req, res) {
  var { userId, meetupId } = req.body;
  database.ref("users").child(userId).once("value", function(userSnapshot) {
    if (userSnapshot.exists()) {
      database.ref("meetups").child(meetupId).once("value", function(snapshot) {
        if (snapshot.exists()) {
          if (snapshot.hasChild("usersAttending")) {
            var userAttending = {};
            userAttending[userId] = true;
            database.ref("meetups").child(meetupId + "/usersAttending").update(userAttending, function(error) {
              if (error) {
                res.status(500).send({ error: "Internal server error: Could not RSVP to meetup." });
              } else {
                var meetupObj = {};
                meetupObj[meetupId] = true;
                database.ref("users").child(userId + "/meetupsAttending").update(meetupObj);
                res.status(200).send({ message: "success" });
              }
            });
          } else {
            var userAttending = { "usersAttending": {} };
            userAttending["usersAttending"][userId] = true;
            database.ref("meetups").child(meetupId).update(userAttending, function(error) {
              if (error) {
                res.status(500).send({ error: "Internal server error: Could not RSVP to meetup." });
              } else {
                var meetupObj = {};
                meetupObj[meetupId] = true;
                database.ref("users").child(userId + "/meetupsAttending").update(meetupObj);
                res.status(200).send({ message: "success" });
              }
            });
          }
        } else {
          res.status(400).send({ error: "Meetup does not exist." });
        }
      });
    } else {
      res.status(400).send({ error: "User does not exist." });
    }
  });
}

/**
  Add a reaction to a specific meetup

  Reaction can either be up vote or down vote or neutral
  reaction:
    1: upvote
    0: neutral
    -1: downvote
*/
exports.postMeetupReaction = function(req, res) {
  var { userId, meetupId, reaction } = req.body;
  database.ref("users").child(userId).once("value").then(function(userSnapshot) {
    if (userSnapshot.exists()) {
      database.ref("meetups").child(meetupId).once("value").then(function(snapshot) {
        if (snapshot.exists()) {
          database.ref("meetups").child(meetupId).update({
            "votes" : snapshot.val().votes + (reaction == 0 ? -(userSnapshot.val()[userId].reactions.meetups[meetupId]) : reaction)
          }, function(error) {
            if (error) {
              res.status(500).send({ error: "Could not create reaction for meetup." });
            } else {
              const userReactionKey = "reactions/meetups/" + meetupId;
              if (reaction != 0) {
                var userReaction = {};
                userReaction[userReactionKey] = reaction;
                database.ref("users/" + userId).update(userReaction, function(error) {
                  if (error) {
                    res.status(500).send({ error: "Internal server error: Could not create reaction for meetup." });
                  } else {
                    res.status(200).send({ message: "success" });
                  }
                });
              } else {
                database.ref("users").child(userId + "/" + userReactionKey).remove(function(error) {
                  if (error) {
                    res.status(500).send({ error: "Internal server error: Could not create reaction for meetup." });
                  } else {
                    res.status(200).send({ message: "success" });
                  }
                });
              }
            }
          });
        } else {
          res.status(400).send({ error: "Meetup does not exist." });
        }
      });
    } else {
      res.status(400).send({ error: "User does not exist." });
    }
  });
}

/**
  Add a new comment to a specific meetup
*/
exports.postMeetupComment = function(req, res) {
  var { userId, meetupId, comment } = req.body;
  let timestamp = Math.floor(Date.now() / 1000);
  database.ref("users").child(userId).once("value").then(function(userSnapshot) {
    if (userSnapshot.exists()) {
      database.ref("meetups").child(meetupId).once("value").then(function(snapshot) {
        if (snapshot.exists()) {
          var meetupCommentRef = database.ref("meetupComments").push();
          var meetupCommentKey = meetupCommentRef.key;
          let commentsKey = "comments/" + meetupCommentKey;
          meetupCommentRef.set({
            "author": userId,
            "authorName": userSnapshot.val().username,
            "meetupId": meetupId,
            "comment": comment,
            "timestamp": timestamp,
            "votes": 0
          }, function(error) {
            if (error) {
              res.status(500).send({ error: "Internal server error: Comment could not be created for meetup." });
            } else {
              var newComment = {};
              newComment[commentsKey] = true;
              database.ref("meetups").child(meetupId).update(newComment, function(error) {
                if (error) {
                  res.status(500).send({ error: "Internal server error: Comment could not be created for meetup." });
                } else {
                  res.status(200).send({ message: "success" });
                }
              });
            }
          });
        } else {
          res.status(400).send({ error: "Meetup does not exist." });
        }
      });
    } else {
      res.status(400).send({ error: "User does not exist." });
    }
  });
}

/**
  Add a reaction to a comment for a specific meetup

  Reaction can either be up vote or down vote or neutral
  reaction:
    1: upvote
    0: neutral
    -1: downvote
*/
exports.postMeetupCommentReaction = function(req, res) {
  var { userId, meetupCommentId, reaction } = req.body;
  database.ref("users").child(userId).once("value").then(function(userSnapshot) {
    if (userSnapshot.exists()) {
      database.ref("meetupComments").child(meetupCommentId).once("value").then(function(snapshot) {
        if (snapshot.exists()) {
          database.ref("meetupComments").child(meetupCommentId).update({
            "votes" : snapshot.val().votes + (reaction == 0 ? -(userSnapshot.val()[userId].reactions.meetupComments[meetupCommentId]) : reaction)
          }, function(error) {
            if (error) {
              res.status(500).send({ error: "Could not create reaction for meetup comment." });
            } else {
              const userReactionKey = "reactions/meetupComments/" + meetupCommentId;
              if (reaction != 0) {
                var userReaction = {};
                userReaction[userReactionKey] = reaction;
                database.ref("users/" + userId).update(userReaction, function(error) {
                  if (error) {
                    res.status(500).send({ error: "Internal server error: Could not create reaction for meetup comment." });
                  } else {
                    res.status(200).send({ message: "success" });
                  }
                });
              } else {
                database.ref("users").child(userId + "/" + userReactionKey).remove(function(error) {
                  if (error) {
                    res.status(500).send({ error: "Internal server error: Could not create reaction for meetup comment." });
                  } else {
                    res.status(200).send({ message: "success" });
                  }
                });
              }
            }
          });
        } else {
          res.status(400).send({ error: "Meetup comment does not exist." });
        }
      });
    } else {
      res.status(400).send({ error: "User does not exist." });
    }
  });
}
