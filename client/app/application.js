angular.module('forinlanguages', [
  'ngRoute',
  'forinlanguages.services',
  'forinlanguages.peer'
])

.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'app/views/main.html',
      controller: 'PeerController',
    })
    .otherwise({
      redirect: '/'
    })
})
// Main app stuff here