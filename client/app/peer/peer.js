angular.module('forinlanguages.peer', [])

.controller('PeerController', function($scope, $window, $location, PeerFactory) {
  // Init input models
  $scope.person = "";
  $scope.message = "";
  $scope.username = "";

  // Object of connected peers and messages received/send
  $scope.peers = {};
  $scope.messages = [];

  // Init peer instance for user
  $scope.me = PeerFactory.makePeer($scope.me);

  $scope.me.on('connection', function(c) {
    PeerFactory.handleConnection(c, $scope.peers, $scope.messages);
  });

  $scope.me.on('error', function(err) {
    console.log("Some ERROR:", err);
  });

  $scope.connectTo = function() {
    var conn = PeerFactory.connectTo($scope.person, $scope.peers, $scope.me)
    conn.on('open', function() {
      PeerFactory.handleConnection(conn, $scope.peers, $scope.messages);
      console.log('connected to someone?');
      console.log($scope.peers);
      console.log("Length:", Object.keys($scope.peers).length);
    });
    conn.on('error', function(err) { alert(err); });
  }

  $scope.sendData = function() {
    if(Object.keys($scope.peers).length === 0) {
      return alert("Can't send data to no users!");
    }
    if($scope.username === "" || $scope.text === "") {
      return alert("can't use an empty name or textbox");
    }
    var dataToSend = {
      text: $scope.message,
      time: moment().format('h:mm:ss a'),
      name: $scope.username
    };
    $scope.messages.push(dataToSend);
    PeerFactory.sendData(dataToSend, $scope.peers);
    console.log('send data');
  };

  $window.onunload = $window.onbeforeunload = function(e) {
    if(!!$scope.me && !$scope.me.destroyed) {
      $scope.me.destroy();
    }
  };
})