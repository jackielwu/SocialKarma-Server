var express = require('express');

module.exports = function(app) {
  /* Controllers */
  var mainController = require('../controllers/mainController');
  var meetupController = require('../controllers/meetupController');
  var postsController = require('../controllers/postsController');
  var messagesController = require('../controllers/messagesController');

  /* Define routes here */
  app.get('/', mainController.getMain);

  /* Meetup endpoints */
  // GET
  app.get('/meetups', meetupController.getMeetups);
  app.get('/meetup/comments', meetupController.getMeetupComments);
  app.get('/meetup/comments/:meetupId', meetupController.getMeetupComments);


  // POST
  app.post('/meetup/rsvp', meetupController.postRsvpMeetup);
  app.post('/meetup/reaction', meetupController.postMeetupReaction);
  app.post('/meetup/comment/reaction', meetupController.postMeetupCommentReaction);
  app.post('/meetup/comment', meetupController.postMeetupComment);
  app.post('/meetup', meetupController.postNewMeetup);
  app.post('/meetupDetail', meetupController.getMeetupDetail);


  /* Posts endpoints */

  // POST
  app.post('/post', postsController.postNewPost);
  app.post('/post/delete', postsController.postDeletePost);
  app.post('/post/vote', postsController.postPostVote);
  app.post('/post/comment', postsController.postPostComment);
  app.post('/post/comment/delete', postsController.postDeleteComment);
  app.post('/post/comment/vote', postsController.postPostCommentVote);


  // GET
  app.get('/posts', postsController.getPosts);
  app.get('/geo', postsController.geo);
  app.post('/post/comments', postsController.getPostComments);


  /* Messages endpoints */

  // GET
  app.get('/messages', messagesController.getMessages);

  // POST
  app.post('/chat', messagesController.postChat);
  app.post('/message', messagesController.postMessage);
};
