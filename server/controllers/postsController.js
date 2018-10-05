"use strict";

var path = require('path');
var firebase = require('../config/fire');
var database = firebase.database();

function calcGeo (lat, lng) {
    return new Promise(function(resolve, reject) {
        database.ref("geolocation").once("value", function (snapshot) {
            snapshot.forEach(function (entry) {
                if (entry.child("coord1/lat").val() >= lat
                    && entry.child("coord2/lat").val() <= lat
                    && entry.child("coord1/lng").val() <= lng
                    && entry.child("coord2/lng").val() >= lng
                ) {
                    resolve(entry.key);
                }
            });
        });
    });
}

exports.geo = async function(req, res) {
    var { lat, lng } = req. query;
    //40.424305, -86.913188
    var g = await calcGeo(lat, lng);
    res.status(200).send({ geo: g });
    return;
};

/* GET */

exports.getPosts = function(req, res) {
    var { geolocation } = req.query;
    if (geolocation === undefined) {
        res.status(400).send({ error: "Required parameters to query posts are missing."});
        return;
    } else {
        var ref = database.ref("posts");
        ref.orderByChild("geolocation").equalTo(geolocation).on("value", function(snapshot) {
            if (snapshot.exists()) {
                res.status(200).send(snapshot.val());
                return;
            } else {
                res.status(500).send({ error: "Internal Server Error: Could not get posts."});
                return;
            }
        });
    }
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
    database.ref("users").child(author).once("value", function(snapshot) {
        if (snapshot.exists()) {
            var newPost = {
                geolocation: calcGeo(location["lat"], location["lng"]),
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
