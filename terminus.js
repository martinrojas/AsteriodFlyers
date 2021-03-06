var io;
var expSocket;
var worldData;

/**
 * This function is called by app.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    expSocket = socket;
    expSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    expSocket.on('hostCreateNewExperience', hostCreateNewExperience);
    expSocket.on('hostRoomReady', hostPrepareExperience);
    expSocket.on('hostCountdownFinished', hostStartGame);
    expSocket.on('hostWorldData', hostWorldData);
    
    // Second Screen Functions
    expSocket.on('screenJoinGame', screenJoinGame);

    // Player Events
    expSocket.on('mobileJoinExp', mobileJoinExp);
    expSocket.on('controlTick', controlTick);
    expSocket.on('playerRestart', playerRestart);
}


/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewExperience' event occurred.
 */
function hostCreateNewExperience() {
    // Create a unique Socket.IO Room
    var thisExperienceId = ( Math.random() * 1000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('beginNewExperience', {gameId: thisExperienceId, mySocketId: this.id});

    // Join the Room and wait for the players
    this.join(thisExperienceId.toString());
};

/*
 * players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareExperience(gameId) {
    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameId : gameId
    };
    console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('launchNewExp', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    console.log('Game Started.');
    playerStart(gameId);
};

// If the current round exceeds the number of words, send the 'gameOver' event.
// io.sockets.in(data.gameId).emit('gameOver',data);
    
/*
 * Store the world data
 */
 function hostWorldData (data) {
     worldData = data;
 }


/* *****************************
   *                           *
   *     SCREEN FUNCTIONS      *
   *                           *
   ***************************** */

function screenJoinGame (data) {
    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = expSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;
        data.worldData = worldData;

        // Join the room
        sock.join(data.gameId);

        console.log('second screen game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('onScreenJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}

/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function mobileJoinExp(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = expSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        console.log('joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('mobileJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}

/**
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function controlTick(data) {
    // console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    io.sockets.in(data.gameId).emit('hostControlTick', data);
}


/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    // console.log('Player: ' + data.playerName + ' ready for new game.');

    // Emit the player's data back to the clients in the game room.
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}