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
            IO.socket.on('beginNewExperience', IO.beginNewExperience );            
            IO.socket.on('hostControlTick', IO.hostControlTick);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
        },

        /**
         * Both players have joined the game.
         * @param ioData
         */
        beginNewExperience : function(ioData) {
            App.Host.experienceInit(ioData);
        },

        /**
         * A player answered. If this is the host, check the answer.
         * @param ioData
         */
        hostControlTick : function(ioData) {
                App.Host.checkControlTick(ioData);
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
        }
	}

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
            App.initExperience();
            App.bindEvents();
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
                        
        },

        /* *************************************
         *         Experience Logic            *
         * *********************************** */

        /**
         * Initialize room display the room number
         * 
         */
        initExperience: function() {
            console.log('Create a new Experience');
            IO.socket.emit('hostCreateNewExperience');
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
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            experienceInit: function (data) {
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
                
                // Display the URL on screen
                $('#gameURL').text(window.location.host);
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
        }


	};
	IO.init();
    App.init();
}($));