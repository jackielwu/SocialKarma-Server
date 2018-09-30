var path = require('path');

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
}

/**
  RSVP to a specific meetup
*/
exports.postRsvpMeetup = function(req, res) {
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
