var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var cookieParser = require('cookie-parser');
var routes = require('./router/routes');

var PORT = process.env.PORT || 8080;

var app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.listen(process.env.PORT || 8080, function() {
  console.log("Listening on port " + PORT);
});

routes(app);
