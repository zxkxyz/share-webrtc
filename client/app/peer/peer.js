angular.module('forinlanguages.peer', [])

.controller('PeerController', function($scope, $window, $location, PeerFactory) {
  $scope.person = "";
  $scope.peers = {};
  $scope.me = PeerFactory.makePeer($scope.me);
  console.log("me:", $scope.me);

  $scope.me.on('connection', function(c) {
    PeerFactory.handleConnection(c, $scope.peers);
  });

  $scope.me.on('error', function(err) {
    console.log("Some ERROR:", err);
  });

  $scope.connectTo = function() {
    var conn = PeerFactory.connectTo($scope.person, $scope.peers, $scope.me)
    conn.on('open', function() {
      PeerFactory.handleConnection(conn, $scope.peers);
      console.log('connected to someone?');
      console.log($scope.peers);
    });
    conn.on('error', function(err) { alert(err); });
  }
})