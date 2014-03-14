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
            IO.socket.on('mobileJoinedRoom', IO.mobileJoinedRoom );
            IO.socket.on('launchNewExp', IO.launchNewExp );  


            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('hostControlTick', IO.hostControlTick);
            IO.socket.on('gameHasStarted', IO.gameHasStarted);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
            // console.log(ioData.message);
        },

        playerJoinedRoom : function(ioData) {
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.
            //
            App[App.myRole].updateWaitingScreen(ioData);
        },

        /**
         * Both players have joined the game.
         * @param ioData
         */
        launchNewExp : function(ioData) {
            App[App.myRole].onGameStart(ioData);
        },



	};

	var App ={
		 /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the mobiles and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'mobile' browsers.
         */
        myRole: '',   // 'mobile', 'Host' or 'Screen'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each mobile and host. It is generated when the browser initially
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
            App.$mobileExp = $('#participant-screen-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            
            // mobile
            App.$doc.on('click', '#btnJoinGame', App.mobile.onJoinClick);
            App.$doc.on('click', '#btnMobileStart',App.mobile.onmobileStartClick);
            App.$doc.on('click', '.gameControl',App.mobile.onmobileControlDown);
            App.$doc.on('click', '#btnmobileRestart', App.mobile.onmobileRestart);

            
        },

        /* *****************************
           *        mobile CODE        *
           ***************************** */

        mobile : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The mobile's name entered on the 'Join' screen.
             */
            myName: '',

            /**
             * The mobile's rotation counter.
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

                // Display the Join Game HTML on the mobile's screen.
                App.$gameArea.html(App.$templateJoinGame);
            },

            onGameStart: function () {
                if(App.myRole == 'mobile')
                App.$gameArea.html(App.$mobileExp);
            },

            /**
             * The mobile entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onmobileStartClick: function() {
                // console.log('mobile clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    mobileName : 'anon'
                };

                // Send the gameId and mobileName to the server
                IO.socket.emit('mobileJoinExp', data);

                // Set the appropriate properties for the current mobile.
                App.myRole = 'mobile';
                App.mobile.myName = data.mobileName;
            },

            /**
             *  Click handler for the mobile hitting a direction button.
             */
            onmobileControlDown: function() {
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
                        App.mobile.alpha = undefined;
                        App.mobile.beta = undefined;
                        App.mobile.gamma = undefined;
                        break;
                    case 'motion':
                        console.log('added motion listener');
                        window.addEventListener('deviceorientation', App.mobile.onDevOrientHandler, false);
                        break;

                }                

                // Send the mobile info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    mobileId: App.mySocketId,
                    id: answer
                }
                IO.socket.emit('controlTick',data);
            },

            onDevOrientHandler: function (eventData) {
                if(App.mobile.alpha == undefined) App.mobile.alpha = Math.min(eventData.alpha);
                if(App.mobile.beta == undefined) App.mobile.beta = Math.min(eventData.beta);
                if(App.mobile.gamma == undefined) App.mobile.gamma = Math.min(eventData.gamma);
                
                if (App.mobile.counter > 1) {
                    // console.log('L/R = ' + eventData.gamma + ', U/D = ' + eventData.beta - App.mobile.beta);
                    App.mobile.counter = 0;

                    // gamma is the left-to-right tilt in degrees, where right is positive
                    // beta is the front-to-back tilt in degrees, where front is positive
                    // alpha is the compass direction the device is facing in degrees                    

                    var data = {
                        gameId: App.gameId,
                        mobileId: App.mySocketId,
                        id: 100,
                        alpha: Math.min(eventData.alpha),
                        beta: Math.min(eventData.beta) - App.mobile.beta,
                        gamma: Math.min(eventData.gamma)
                    }

                    IO.socket.emit('controlTick',data);
                }

                App.mobile.counter++;
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onmobileRestart : function() {
                var data = {
                    gameId : App.gameId,
                    mobileName : App.mobile.myName
                }
                IO.socket.emit('mobileRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
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
                            .attr('id','btnmobileRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        }
	};


	IO.init();
    App.init();


}($));