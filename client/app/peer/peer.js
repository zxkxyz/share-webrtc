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

  // Init peer instance for user
  PeerFactory.makePeer(function(newUser, url) {
    $scope.me = newUser;
    $scope.url = url;
    $scope.$digest();

    console.log($scope.me);

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
          alert("Person with ID " + conn.peer + " left the chat.");
        } else {
          $scope.peers[conn.peer] = conn;
          $scope.$digest();
        }
      },
      function(data) {
        console.log("data in the callback:", data);
        var arr = new Uint8Array(data.rawdat);
        console.log("Uintarr", arr);
        var blob = new Blob([arr]);
        var blobUrl = window.URL.createObjectURL(blob);
        $scope.files.push(blobUrl);
        $scope.$digest();
        saveAs(blob, data.filename);
        // var myFile = new File([arr], "idk.txt");
        // console.log('myfile', myFile);
      });
    });

    $scope.me.on('error', function(err) {
      console.log("Some ERROR:", err);
    });
  });

  $scope.connectTo = function() {
    var c = PeerFactory.connectTo($scope.person, $scope.me);
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
          alert("Person with ID " + conn.peer + " left the chat.");
        } else {
          $scope.peers[conn.peer] = conn;
          $scope.$digest();
        }
      },
      function(data) {
        console.log("data in the callback:", data);
        var arr = new Uint8Array(data.rawdat);
        console.log("Uintarr", arr);
        var blob = new Blob([arr]);
        var blobUrl = window.URL.createObjectURL(blob);
        $scope.fileUrl = blobUrl;
        $scope.$digest();
        saveAs(blob, data.filename);
        // var myFile = new File([arr], "idk.txt");
        // console.log('myfile', myFile);
      });
    });
    c.on('error', function(err) { alert(err); });
  }

  $scope.sendData = function(type) {
    if(Object.keys($scope.peers).length === 0) {
      return alert("Can't send data to no users!");
    }
    if($scope.username === "") {
      return alert("can't use an empty name");
    }
    if(type === "message") {
      if($scope.message === "") {
        return alert("can't use no text")
      }
      var dataToSend = {
        rawdat: $scope.message,
        time: moment().format('h:mm:ss a'),
        name: $scope.username,
        type: 'message'
      };
      $scope.messages.push(dataToSend);
      PeerFactory.sendData(dataToSend, $scope.peers);
    } else if (type === "file") {
      if($scope.file.length === 0 || $scope.file.length > 1) {
        return alert("no file or too many files, only one file supported at this time");
      }
      console.log($scope.file);
      var dataToSend = {
        rawdat: $scope.file[0],
        time: moment().format('h:mm:ss a'),
        name: $scope.username,
        filename: $scope.file[0].name,
        type: 'file'
      }
      PeerFactory.sendData(dataToSend, $scope.peers);
    } else {
      alert("you screwed up")
    }
  };

  $window.onunload = $window.onbeforeunload = function(e) {
    if(!!$scope.me && !$scope.me.destroyed) {
      $scope.me.destroy();
    }
  };

  $scope.$watch('file', function (files, old) {
    if(files !== old) {
      $scope.sendData("file");
    }
  });

})