var path = require('path');
var firebase = require('../config/fire');
var database = firebase.database();

/* GET */

exports.getMessages = function(req, res) {
  var { userId } = req.query;
  var ref = database.ref("users");
  ref.child(userId + "/chats").once("value", function(snapshot) {
    if (snapshot.exists()) {
      var snapval = snapshot.val();
      var promises = [];
      Object.keys(snapval).forEach(function(key, index) {
        promises.push(database.ref("chats").child(key).once("value"));
        promises.push(database.ref("chatMembers").child(key).once("value"));
      });
      var chatsObj = {};
      Promise.all(promises).then(function(snapshots) {
        var chats = [];
        snapshots.forEach(function(snap) {
          if (!chatsObj[snap.key]) {
            chatsObj[snap.key] = {};
          }
          if (snap.val().lastTimestamp && snap.val().lastMessage && snap.val().lastSentUser) {
            chatsObj[snap.key].lastTimestamp = snap.val().lastTimestamp;
            chatsObj[snap.key].lastMessage = snap.val().lastMessage;
            chatsObj[snap.key].lastSentUser = snap.val().lastSentUser;
            chatsObj[snap.key].readReceipt = snap.val().readReceipt;
          } else if (!snap.val().lastTimestamp && !snap.val().lastMessage && !snap.val().lastSentUser) {
            chatsObj[snap.key].members = snap.val();
          }
        });
        Object.keys(chatsObj).forEach(function(key, index) {
          var chatObj = {};
          Object.keys(chatsObj[key]).forEach(function(chatsObjKey, index) {
            if (chatsObjKey === "members") {
              Object.keys(chatsObj[key].members).forEach(function(membersKey, index) {
                if (membersKey !== userId) {
                  chatObj.partnerId = membersKey;
                }
              });
            } else {
              chatObj[chatsObjKey] = chatsObj[key][chatsObjKey];
            }
          });
          chatObj.chatId = key;
          chats.push(chatObj);
        });
        return res.status(200).send(chats);
      });
    } else {
      return res.status(200).send([]);
    }
  });
};

/* POST */

exports.postChat = function(req, res) {
  var { userId, partnerId, message } = req.body;
  var ref = database.ref("users");
  let timestamp = Math.floor(Date.now() / 1000);
  ref.child(userId).once("value", function(snapshot) {
    if (snapshot.exists()) {
      var userval = snapshot.val();
      var lastMessageString = "";
      if (message.length >= 30) {
        lastMessageString = userval.username + ": " + message.substring(0, 30) + "...";
      } else {
        lastMessageString = userval.username + ": " + message;
      }
      var chatObject = {
        lastTimestamp: timestamp,
        lastMessage: lastMessageString,
        lastSentUser: userId,
        readReceipt: false
      };
      var messageObject = {
        timestamp: timestamp,
        userId: userId,
        message: message
      };
      var membersObject = {};
      membersObject[userId] = true;
      membersObject[partnerId] = true;
      var newChatRef = database.ref("chats").push();
      newChatRef.set(chatObject, function(error) {
        if (error) {
          return res.status(500).send({ error: "Could not create new chat." });
        } else {
          var newMembersRef = database.ref("chatMembers/" + newChatRef.key).set(membersObject, function(error) {
            if (error) {
              return res.status(500).send({ error: "Could not create new members for chat." });
            } else {
              var newMessageRef = database.ref("messages/" + newChatRef.key).push();
              newMessageRef.set(messageObject, function(error) {
                if (error) {
                  return res.status(500).send({ error: "Could not create new message." });
                } else {
                  var userChat = userId + "/chats/" + newChatRef.key;
                  var partnerChat = partnerId + "/chats/" + newChatRef.key;
                  var newUserChatObj = {};
                  newUserChatObj[userChat] = true;
                  newUserChatObj[partnerChat] = true;
                  ref.update(newUserChatObj, function(error) {
                    if (error) {
                      return res.status(500).send({ error: "Could not create new chat for user." });
                    } else {
                      return res.status(200).send({ message: "success." });
                    }
                  });
                }
              });
            }
          });
        }
      });
    } else {
      return res.status(400).send({ error: "User does not exist." });
    }
  });
};

exports.postMessage = function(req, res) {
  var { chatId, userId, message } = req.body;
  let timestamp = Math.floor(Date.now() / 1000);
  var ref = database.ref("users");
  ref.child(userId).once("value", function(snapshot) {
    if (snapshot.exists()) {
      var userval = snapshot.val();
      var messageObject = {
        timestamp: timestamp,
        userId: userId,
        message: message
      };
      database.ref("messages/" + chatId).push().set(messageObject, function(error) {
        if (error) {
          return res.status(400).send({ error: "Messages do not exist." });
        } else {
          var lastMessageString = "";
          if (message.length >= 30) {
            lastMessageString = userval.username + ": " + message.substring(0, 30) + "...";
          } else {
            lastMessageString = userval.username + ": " + message;
          }
          var chatObject = {
            lastTimestamp: timestamp,
            lastMessage: lastMessageString,
            lastSentUser: userId,
            readReceipt: false
          };
          database.ref("chats/" + chatId).set(chatObject, function(error) {
            if (error) {
              return res.status(200).send({ error: "Could not set chat." });
            } else {
              return res.status(200).send({ message: "success." });
            }
          });
        }
      });
    } else {
      return res.status(400).send({ error: "User does not exist." });
    }
  });
};
