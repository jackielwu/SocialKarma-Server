var path = require('path');
var firebase = require('../config/fire');
var database = firebase.database();

/* GET */

/**
  Get list of meetups

  Default limit to 20 meetups per call
*/
exports.getMeetups = function(req, res) {
  var { startAt } = req.query;
  var ref = database.ref("meetups");
  if (startAt === undefined) {
    ref.orderByChild("startTime").limitToLast(5).once("value", function(snapshot) {
      res.status(200).send(snapshot.val());
    });
  } else {
    ref.orderByChild("startTime").startAt(parseInt(startAt)).limitToLast(5).once("value", function(snapshot) {
      if (snapshot.exists()) {
        res.status(200).send(snapshot.val());
      } else {
        res.status(500).send({ error: "Internal Server Error: Invalid startAt time."});
      }
    });
  }
}

/**
  Get detail for a specific meetup
*/
exports.getMeetupDetail = function(req, res) {
}

/**
  Get comments for a specific meetup

  Default limit to 20 meetups per call
*/
exports.getMeetupComments = function(req, res) {
}


/* POST */

/**
  Create new meetup
*/
exports.postNewMeetup = function(req, res) {
  var { title, startTime, endTime, location, organizer } = req.body;
  if (title === undefined || startTime === undefined || endTime === undefined || location === undefined || organizer === undefined) {
    res.status(400).send({ error: "Required parameters to create a new meetup are missing."} );
    return;
  } else if (location["name"] === undefined && location["coordinates"] === undefined) {
    res.status(400).send({ error: "Invalid location parameter" });
    return;
  } else if (location["coordinates"] != undefined) {
    if (location["coordinates"]["lat"] === undefined || location["coordinates"]["lng"] === undefined) {
      res.status(400).send({ error: "Invalid location parameter" });
      return;
    }
  }
  database.ref("users").child(organizer).once("value", function(snapshot) {
    if (snapshot.exists()) {
      var newMeetup = {
        title: title,
        startTime: startTime,
        endTime: endTime,
        location: location,
        organizer: organizer,
      }
      var { description } = req.body;
      if (description != undefined) {
        newMeetup.description = description;
        newMeetup.shortDescription = description.substring(0, 100);
      }
      database.ref("meetups").push().set(newMeetup, function(error) {
        if (error) {
          res.status(500).send({ error: "Internal server error: Meetup could not be created."});
        } else {
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
            "meetup": meetupId,
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
