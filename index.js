var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = 6060
server.listen(6060, () => console.log('Example app listening on port: ', port));

var connectedUsers = {};


// Subscribe to redis events pushed by rails server
var redis = require("redis").createClient();
redis.subscribe("bmmerce:new-message"); // prefixed with rails app namespace

// Listen for the publish message event
redis.on('message', function (channel, message) {
    var newMessage = JSON.parse(message);

    console.log("NEW MESSAGE DATA", newMessage);

    var userScope = `${newMessage.engagement.listing_id}-${newMessage.recipient_id}`;

    if (connectedUsers[userScope]) {
        connectedUsers[userScope].emit(channel, newMessage);
    }

    // console.log('Redis channel: ', channel);
    // console.log('Redis message: ', message);
    // console.log("Parsed Message: ", newMessage);
});

io.on('connection', function (socket) {
    console.log("A client has connected");

    socket.on('connectUser', function (userScope) {
        //socket.join(room);
        connectedUsers[userScope] = socket;
        //console.log("CONNECTED USERS: ", connectedUsers);
        console.log("CONNECTED USERS COUNT: ", Object.keys(connectedUsers).length);
    });

    socket.on('senderTyping', function (data) {
        console.log("Typing...");
        console.log("Indicate to user: ", data)
        if (connectedUsers[data.indicateScope]) {
            connectedUsers[data.indicateScope].emit('onTyping', data.typing);
        }
    });

    socket.on('disconnect', function () {
        console.log('Client disconnected');
        //socket.io.reconnect();
        //console.log("CONNECTED USERS COUNT: ", Object.keys(connectedUsers).length);
    });
});