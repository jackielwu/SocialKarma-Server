var express = require('express');

module.exports = function(app) {
  var mainController = require('../controllers/mainController');
  var meetupController = require('../controllers/meetupController');

  /* Define routes here */
  app.get('/', mainController.getMain);

  /* Meetup endpoints */
  app.get('/meetups', meetupController.getMeetups);
  app.get('/meetup', meetupController.getMeetupDetail);
  app.get('/meetup/comments', meetupController.getMeetupComments);
  app.post('/meetup', meetupController.postNewMeetup);
  app.post('/meetup/rsvp', meetupController.postRsvpMeetup);
  app.post('/meetup/reaction', meetupController.postMeetupReaction);
  app.post('/meetup/comment', meetupController.postMeetupComment);
  app.post('/meetup/comment/reaction', meetupController.postMeetupCommentReaction);
}
