var firebase = require('firebase');

const config = {
  apiKey: "AIzaSyD7cBhyulON8Nf6W9e2NA8L7orwGSYLrXo",
  authDomain: "social-karma-842b3.firebaseapp.com",
  databaseURL: "https://social-karma-842b3.firebaseio.com/",
  projectId: "social-karma-842b3",
};

const fire = firebase.initializeApp(config);

module.exports = fire;
