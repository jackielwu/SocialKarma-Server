"use strict";

var path = require('path');
var firebase = require('../config/fire');
var database = firebase.database();

/* GET */

exports.getPosts = function(req, res) {

};

/* POST */

/**
 * Create new post
 */
exports.postNewPost = function(req, res) {
    var { location, author, content } = req.body;
    if (location === undefined || author === undefined || content === undefined) {
        res.status(400).send({ error: "Required parameters to create a new post are missing."} );
        return;
    } else if (location["lat"] === undefined || location["lng"] === undefined) {
        res.status(400).send({ error: "Invalid location parameter" });
        return;
    }
    database.ref("users").child(author).then(function(snapshot) {
        if (snapshot.exists()) {
            var newPost = {
                location: location,
                author: author,
                content: content,
                karma: 0
            };
            database.ref("posts").push().set(newPost, function(error) {
                if (error) {
                    res.status(500).send({ error: "Internal server error: Post could not be created."});
                } else {
                    res.status(200).send({ message: "success" });
                }
            });
        } else {
            res.status(400).send({ error: "User does not exist." });
        }
    });
};
