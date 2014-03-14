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
            IO.socket.on('onScreenJoinedRoom', IO.onScreenJoinedRoom);
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

        onScreenJoinedRoom : function (ioData) {
            data = ioData.worldData;
            App.Screen.onScreenStarted();
        },
        
        /**
         * A player answered. If this is the host, check the answer.
         * @param ioData
         */
        hostControlTick : function(ioData) {
                App.Screen.checkControlTick(ioData);
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

            App.$doc.on('click', '#btnScreenStart',App.Screen.onScreenStartClick);

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
                        if (data.id == 1) { move = 4};
                        if (data.id == 2) { move = 3};
                        if (data.id == 100) { 
                            move = 103;
                            LR = data.gamma ;
                            UD = data.beta ;
                        };
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
        
    }


	IO.init();
    App.init();
}($));