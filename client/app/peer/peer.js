angular.module('forinlanguages.peer', [])

.controller('PeerController', function($scope, $window, $location, PeerFactory) {
  // Init input models
  $scope.person = "";
  $scope.message = "";
  $scope.username = "";
  $scope.me = {};

  // Object of connected peers and messages received/send
  $scope.peers = {};
  $scope.messages = [];

  // $scope.$watch('peers', function(newVal, oldVal) {
  //   console.log('detected change in peers obj');
  //   $scope.peers = $scope.peers;
  // });

  // $scope.$watch('messages', function(newVal, oldVal) {
  //   console.log('detected change in messages array');
  //   $scope.messages = $scope.messages;
  // });

  // $scope.$watch('me', function(newVal, oldVal) {
  //   console.log('detected change in me object');
  //   $scope.me = $scope.me;
  // });

  // Init peer instance for user
  PeerFactory.makePeer($scope.me, $scope);

  $scope.me.on('connection', function(c) {
    PeerFactory.handleConnection(c, $scope.peers, $scope.messages, $scope);
  });

  $scope.me.on('error', function(err) {
    console.log("Some ERROR:", err);
  });

  $scope.connectTo = function() {
    var conn = PeerFactory.connectTo($scope.person, $scope.peers, $scope.me)
    conn.on('open', function() {
      PeerFactory.handleConnection(conn, $scope.peers, $scope.messages, $scope);
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
  };

  $window.onunload = $window.onbeforeunload = function(e) {
    if(!!$scope.me && !$scope.me.destroyed) {
      $scope.me.destroy();
    }
  };
})