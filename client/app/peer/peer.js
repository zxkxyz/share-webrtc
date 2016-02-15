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
  $scope.files = [];
  $scope.fileQueue = [];

  // Init peer instance for user
  PeerFactory.makePeer(function(newUser, id) {
    $scope.me = newUser;
    $scope.url = "/p/" + id;
    $scope.$digest();

    console.log($scope.me);

    $scope.me.on('connection', function(c) {
      $scope.handleConnection(c);
    });

    $scope.me.on('error', function(err) {
      console.log("Some ERROR:", err);
    });
  });

  $scope.connectTo = function() {
    var c = PeerFactory.connectTo($scope.person, $scope.me);
    c.on('open', function() {
      $scope.handleConnection(c);
    });
    c.on('error', function(err) { alert(err); });
  }

  $scope.handleConnection = function(c) {
    PeerFactory.handleConnection(c,
      function(data) {
        console.log(data);
        $scope.messages.push("" + data.time + " - " + data.name + ": " + data.rawdat);
        $scope.$digest();
      },
      function(conn) {
        console.log("conn from handlecon:", conn);
        if($scope.peers[conn.peer] !== undefined) {
          if(!$scope.peers[conn.peer].open) {
            delete $scope.peers[conn.peer];
            $scope.$digest();
            $scope.messages.push("User with ID " + conn.peer + " left the chat.");
          }
        } else {
          $scope.peers[conn.peer] = conn;
          $scope.$digest();
          console.log('added new person to the chat')
        }
      },
      function(data) {
        var arr = new Uint8Array(data.rawdat);
        var blob = new Blob([arr]);
        var blobUrl = window.URL.createObjectURL(blob);
        $scope.files.push(blobUrl);
        $scope.$digest();
        saveAs(blob, data.filename);
      });
  }

  $scope.sendData = function(type) {
    if(Object.keys($scope.peers).length === 0) {
      return alert("Can't send data to no users!");
    }
    if(type === "message") {
      if($scope.message === "") {
        return alert("can't use no text")
      }
      var dataToSend = {
        rawdat: $scope.message,
        time: moment().format('h:mm:ss a'),
        name: $scope.username || "anonymous",
        type: "message"
      };
      PeerFactory.sendData(dataToSend, $scope.peers);
      $scope.messages.push("" + dataToSend.time + " - " + dataToSend.name + ": " + dataToSend.rawdat);
    } else if (type === "file") {
      console.log($scope.file);
      for(var x = 0; x < $scope.file.length; x++) {
        var dataToSend = {
          rawdat: $scope.file[x],
          time: moment().format('h:mm:ss a'),
          name: $scope.username || "anonymous",
          filename: $scope.file[x].name,
          type: 'file'
        }
        PeerFactory.sendData(dataToSend, $scope.peers);
      }
    } else {
      alert("you screwed up");
    }
  };

  $scope.destroyPeer = function() {
    console.log("destroyed func!");
    console.log('before', $scope.me);
    $scope.me.destroy();
    console.log("after", $scope.me);
  };

  $scope.logPeers = function() {
    console.log("Peers:", $scope.peers);
  }

  $window.onunload = $window.onbeforeunload = function(e) {
    $scope.me.destroy();
  };

  $scope.$watch('file', function (files, old) {
    if(files !== old) {
      $scope.sendData("file");
    }
  });

})