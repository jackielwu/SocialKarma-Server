var express = require('express');

module.exports = function(app) {
  var mainController = require('../controllers/mainController');
  var meetupController = require('../controllers/meetupController');

  /* Define routes here */
  app.get('/', mainController.getMain);

  /* Meetup endpoints */
  app.get('/meetups', mainController.getMeetups);
  app.get('/meetup', mainController.getMeetupDetail);
  app.get('/meetup/comments', mainController.getMeetupComments);
  app.post('/meetup', mainController.postNewMeetup);
  app.post('/meetup/rsvp', mainController.postRsvpMeetup);
  app.post('/meetup/reaction', mainController.postMeetupReaction);
  app.post('/meetup/comment', mainController.postMeetupComment);
  app.post('/meetup/comment/reaction', mainController.postMeetupCommentReaction);
}
