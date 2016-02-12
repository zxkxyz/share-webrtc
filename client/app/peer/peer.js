angular.module('forinlanguages.peer', [])

.controller('PeerController', function($scope, $window, $location, PeerFactory) {
  // Init input models
  $scope.person = "";
  $scope.message = "";
  $scope.username = "";
  $scope.url = "";
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
  PeerFactory.makePeer(function(newUser, url) {
    $scope.me = newUser;
    $scope.url = url;
    $scope.$digest();

    $scope.me.on('connection', function(c) {
    PeerFactory.handleConnection(c,
      function(data) {
        $scope.messages.push(data);
        $scope.$digest();
      },
      function(conn, bool) {
        if(bool) {
          delete $scope.peers[conn.peer];
          $scope.$digest();
        } else {
          $scope.peers[conn.peer] = conn;
          $scope.$digest();
        }
      });
    });

    $scope.me.on('error', function(err) {
      console.log("Some ERROR:", err);
    });
  });

  $scope.connectTo = function() {
    var c = PeerFactory.connectTo($scope.person, $scope.me)
    c.on('open', function() {
      PeerFactory.handleConnection(c,
      function(data) {
        $scope.messages.push(data);
        $scope.$digest();
      },
      function(conn, bool) {
        if(bool) {
          delete $scope.peers[conn.peer];
          $scope.$digest();
        } else {
          $scope.peers[conn.peer] = conn;
          console.log($scope.peers);
          $scope.$digest();
        }
      });
    });
    c.on('error', function(err) { alert(err); });
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