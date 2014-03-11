jQuery(function ($) {
	
         
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('hostControlTick', IO.hostControlTick);
            IO.socket.on('gameHasStarted', IO.gameHasStarted);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );

            //second screen
            IO.socket.on('onScreenJoinedRoom', IO.onScreenJoinedRoom);
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
            // console.log(ioData.message);
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param ioData {{ gameId: int, mySocketId: * }}
         */
        onNewGameCreated : function(ioData) {
            App.Host.gameInit(ioData);
        },

        /**
         * A player has successfully joined the game.
         * @param ioData {{playerName: string, gameId: int, mySocketId: int}}
         */
        playerJoinedRoom : function(ioData) {
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.
            //
            // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
            // And on the player's browser, App.Player.updateWaitingScreen is called.
            App[App.myRole].updateWaitingScreen(ioData);
        },

        /**
         * Both players have joined the game.
         * @param ioData
         */
        beginNewGame : function(ioData) {
            App[App.myRole].gameCountdown(ioData);
        },

        /**
         * A player answered. If this is the host, check the answer.
         * @param ioData
         */
        hostControlTick : function(ioData) {
            if(App.myRole === 'Host') {
                App.Host.checkControlTick(ioData);
            }else if (App.myRole === 'Screen') {
                App.Screen.checkControlTick(ioData);
            } 

        },

        /**
         * A player answered. If this is the host, check the answer.
         * @param ioData
         */
        gameHasStarted : function(ioData) {
            App.Player.onGameStart();
        },


        /**
         * Let everyone know the game has ended.
         * @param ioData
         */
        gameOver : function(ioData) {
            App[App.myRole].endGame(ioData);
        },

        /**
         * An error has occurred.
         * @param ioData
         */
        error : function(ioData) {
            console.log(ioData.message);
        },

        onScreenJoinedRoom : function (ioData) {
            data = ioData.worldData;
            App.Screen.onScreenStarted();
        }

    };

    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'Player' browsers.
         */
        myRole: '',   // 'Player', 'Host' or 'Screen'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#main-screen-template').html();
            App.$playerGame = $('#participant-screen-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
            // Screen

            App.$doc.on('click', '#btnScreenStart',App.Screen.onScreenStartClick);

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnMobileStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '.gameControl',App.Player.onPlayerControlDown);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);

            
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
        },


        /* *******************************
           *         HOST CODE           *
           ******************************* */
        Host : {

            /**
             * Contains references to player data
             */
            players : [],

            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onCreateClick: function () {
                console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
            },

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                // console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);
                // App.doTextFit('#gameURL');

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string}}
             */
            updateWaitingScreen: function(data) {
                // If this is a restarted game, show the screen.
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                
                // Store the new player's data on the Host.
                App.Host.players.push(data);

                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;

                // If two players have joined, start the game!
                if (App.Host.numPlayersInRoom === 1) {
                    console.log('Room is full. Almost ready!');

                    // Let the server know that two players are present.
                    IO.socket.emit('hostRoomFull',App.gameId);
                }
            },

            /**
             * Show the countdown screen
             */
            gameCountdown : function() {

                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$hostGame); 

                generateHeight( worldWidth, worldDepth );
                mineCraftInit(0);
                animate();

                IO.socket.emit('hostCountdownFinished', App.gameId);               
                IO.socket.emit('hostWorldData', data);
            },            

            checkControlTick : function (data) {
                
                var event = new CustomEvent(
                    "message", 
                    {
                        detail: {
                            id: data.id,
                            alpha: data.alpha,
                            beta: data.beta,
                            gamma: data.gamma
                        },
                        bubbles: true,
                        cancelable: true
                    }
                );
                document.getElementById("gameArea").dispatchEvent(event);
            },

            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            endGame : function(data) {
                
                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }
        },

        /* *****************************
           *    SECOND SCREEN CODE     *
           ***************************** */

        Screen : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The direction L/R/F/B.
             */
            direction: '',

            /**
             * The second screen entered their gameId 
             */
            onScreenStartClick: function() {
                
                direction = $(" #screenOrientation option:selected").val();
                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : 'anon'
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('screenJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Screen';
                App.Screen.screenName = data.playerName;
            }, 

            onScreenStarted : function () {
                if (App.myRole == 'Screen') {
                    App.$gameArea.html(App.$hostGame); 

                    switch(direction){
                        case 'F':
                            mineCraftInit(0);
                            break;
                        case 'B':
                            mineCraftInit(Math.PI);                            
                            break;
                        case 'L':
                            mineCraftInit(Math.PI / 2);
                            break;
                        case 'R':
                            mineCraftInit((3 * Math.PI) / 2);
                            break;
                    }
                    
                    animate();
                };
                
            },

            checkControlTick : function (data) {
                var LR, UD, move = data.id;
                switch(direction){
                    case 'F':
                        if (data.id == 1) { move = 1};
                        if (data.id == 2) { move = 2};
                        if (data.id == 100) { 
                            LR = data.gamma;
                            UD = data.beta;
                        };
                        break;
                    case 'B':

                        if (data.id == 1) { move = 2};
                        if (data.id == 2) { move = 1};
                        if (data.id == 100) { 
                            move = 101;
                            LR = data.gamma * -1;
                            UD = data.beta * -1;
                        };
                        break;
                    case 'L':
                        if (data.id == 1) { move = 3};
                        if (data.id == 2) { move = 4};
                        if (data.id == 100) { 
                            move = 102;
                            LR = data.gamma ;
                            UD = data.beta ;
                        };
                        break;
                    case 'R':
                        if (data.id == 1) { move = 3};
                        if (data.id == 2) { move = 4};
                        break;
                }


                var event = new CustomEvent(
                    "message", 
                    {
                        detail: {
                            id: move,
                            alpha: data.alpha,
                            beta: UD,
                            gamma: LR
                        },
                        bubbles: true,
                        cancelable: true
                    }
                );
                document.getElementById("gameArea").dispatchEvent(event);
            }

        },

        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',

            /**
             * The player's rotation counter.
             */
            counter: 0,

            /**
             * Initial values for the gyroscope.
             */
            alpha: undefined,
            beta: undefined,
            gamma: undefined,

            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$templateJoinGame);
            },

            onGameStart: function () {
                if(App.myRole == 'Player')
                App.$gameArea.html(App.$playerGame);
                if (window.DeviceOrientationEvent) {
                    // Listen for the event and handle DeviceOrientationEvent object
                    console.log('added motion listener');
                    window.addEventListener('deviceorientation', App.Player.onDevOrientHandler, false);
                }
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {
                // console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : 'anon'
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },

            /**
             *  Click handler for the Player hitting a direction button.
             */
            onPlayerControlDown: function() {
                // console.log('Clicked Answer Button');
                var answer;
                switch  ($(this).data("type"))
                {
                    case 'forward': 
                        answer = 1;
                        break;
                    case 'back': 
                        answer = 2;
                        break;
                    case 'stop': 
                        answer = 0;
                        break;
                    case 'recalibrate':
                        App.Player.alpha = undefined;
                        App.Player.beta = undefined;
                        App.Player.gamma = undefined;
                        break;

                }                

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    id: answer
                }
                IO.socket.emit('controlTick',data);
            },

            onDevOrientHandler: function (eventData) {
                if(App.Player.alpha == undefined) App.Player.alpha = Math.min(eventData.alpha);
                if(App.Player.beta == undefined) App.Player.beta = Math.min(eventData.beta);
                if(App.Player.gamma == undefined) App.Player.gamma = Math.min(eventData.gamma);
                
                if (App.Player.counter > 1) {
                    // console.log('L/R = ' + eventData.gamma + ', U/D = ' + eventData.beta - App.Player.beta);
                    App.Player.counter = 0;

                    // gamma is the left-to-right tilt in degrees, where right is positive
                    // beta is the front-to-back tilt in degrees, where front is positive
                    // alpha is the compass direction the device is facing in degrees                    

                    var data = {
                        gameId: App.gameId,
                        playerId: App.mySocketId,
                        id: 100,
                        alpha: Math.min(eventData.alpha),
                        beta: Math.min(eventData.beta) - App.Player.beta,
                        gamma: Math.min(eventData.gamma)
                    }

                    IO.socket.emit('controlTick',data);
                }

                App.Player.counter++;
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            /**
             * Display the waiting screen for player 1
             * @param data
             */
            updateWaitingScreen : function(data) {
                if(IO.socket.socket.sessionid === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
            },

            /**
             * Show the "Game Over" screen.
             */
            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        },


        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);
            // App.doTextFit('#hostWord');

            // console.log('Starting Countdown...');

            // Start a 1 second timer
            var timer = setInterval(countItDown,1000);

            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    // console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        }
    };

    IO.init();
    App.init();


}($));