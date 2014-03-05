// Declare app level module which depends on filters, and services

angular.module('terminus', [])
  .config(terminusRouter);


function terminusRouter ($routeProvider) {
  $routeProvider.
    when('/create', {
      templateUrl: 'partials/create',
      controller: 'CreateCtrl'
    }).
    when('/join', {
      templateUrl: 'partials/join',
      // controller: 'JoinCtrl'
    }).
    when('/host', {
      templateUrl: 'partials/host',
      // controller: 'MyCtrl3'
    }).
    when('/mobile', {
      templateUrl: 'partials/mobile',
      // controller: 'MyCtrl4'
    }).
    when('/room', {
      templateUrl: 'partials/room',
      // controller: 'MyCtrl4'
    }).
    otherwise({
      redirectTo: '/create'
    });
}