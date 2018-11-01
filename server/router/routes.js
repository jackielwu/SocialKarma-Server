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


  // POST
  app.post('/meetup/rsvp', meetupController.postRsvpMeetup);
  app.post('/meetup/reaction', meetupController.postMeetupReaction);
  app.post('/meetup/comment/reaction', meetupController.postMeetupCommentReaction);
  app.post('/meetup/comment', meetupController.postMeetupComment);
  app.post('/meetup', meetupController.postNewMeetup);


  /* Posts endpoints */

  // POST
  app.post('/post', postsController.postNewPost);
  app.post('/post/vote', postsController.postPostVote);
  app.post('/post/comment', postsController.postPostComment);
  app.post('/post/comment/vote', postsController.postPostCommentVote);

  // GET
  app.get('/posts', postsController.getPosts);
  app.get('/geo', postsController.geo);
  app.post('/post/comments', postsController.getPostComments);
};
