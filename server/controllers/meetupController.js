var path = require('path');
var firebase = require('../config/fire');
var database = firebase.database();

/* GET */

/**
  Get list of meetups

  Default limit to 20 meetups per call
*/
exports.getMeetups = function(req, res) {
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
            database.ref("meetups").child(meetupId + "/usersAttending").update({
              userId: true
            }, function(error) {
              if (error) {
                res.status(500).send({ error: "Internal server error: Could not RSVP to meetup." });
              } else {
                res.status(200).send({ message: "success" });
              }
            });
          } else {
            database.ref("meetups").child(meetupId).update({
              "usersAttending": {
                userId: true
              }
            }, function(error) {
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

  Reaction can either be up vote or down vote
*/
exports.postMeetupReaction = function(req, res) {
}

/**
  Add a new comment to a specific meetup
*/
exports.postMeetupComment = function(req, res) {
}

/**
  Add a reaction to a comment for a specific meetup

  Reaction can either be up vote or down vote
*/
exports.postMeetupCommentReaction = function(req, res) {
}
