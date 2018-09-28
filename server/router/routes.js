var express = require('express');

module.exports = function(app) {
  var mainController = require('../controllers/mainController');

  app.get('/', mainController.getMain);
}
