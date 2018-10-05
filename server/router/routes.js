var express = require('express');

module.exports = function(app) {
  /* Controllers */
  var mainController = require('../controllers/mainController');
  var meetupController = require('../controllers/meetupController');
  var postsController = require('../controllers/postsController');

  /* Define routes here */
  app.get('/', mainController.getMain);

  /* Meetup endpoints */
  // GET
  app.get('/meetups', meetupController.getMeetups);
  app.get('/meetup', meetupController.getMeetupDetail);
  app.get('/meetup/comments', meetupController.getMeetupComments);
  app.get('/meetup/comments/:meetupId', meetupController.getMeetupComments);
  app.get('/meetup/:meetupId', meetupController.getMeetupDetail);

  app.get('/posts', postsController.getPosts);

  // POST
  app.post('/meetup/rsvp', meetupController.postRsvpMeetup);
  app.post('/meetup/reaction', meetupController.postMeetupReaction);
  app.post('/meetup/comment/reaction', meetupController.postMeetupCommentReaction);
  app.post('/meetup/comment', meetupController.postMeetupComment);
  app.post('/meetup', meetupController.postNewMeetup);

  app.post('/post', postsController.postNewPost);
};
