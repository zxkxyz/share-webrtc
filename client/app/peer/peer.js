angular.module('forinlanguages.peer', [])

.controller('PeerController', function($scope, $window, $location, $localForage, PeerFactory) {
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
  $scope.incomingFile = {};

  // Init peer instance for user
  PeerFactory.makePeer(function(newUser, id) {
    $scope.me = newUser;
    $scope.url = "/p/" + id;
    $scope.$digest();

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

  // This needs to be outside the callback scope
  var bool = false, want = -2;
  var meta = {};
  $scope.handleConnection = function(c) {
    PeerFactory.handleConnection(c,
      function(data) {
        console.log(data);
        $scope.messages.push(data);
        $scope.$digest();
      },
      function(conn) {
        if($scope.peers[conn.peer] !== undefined) {
          if(!$scope.peers[conn.peer].open) {
            delete $scope.peers[conn.peer];
            $scope.messages.push({rawdat: "User with ID " + conn.peer + " left the chat."});
            $scope.$digest();
          }
        } else {
          $scope.peers[conn.peer] = conn;
          $scope.$digest();
        }
      },
      function(data) {
        if(data.type === "file") {
          $localForage.setItem("bigblob_" + data.filename, new Blob([new Uint8Array(data.rawdat)])).then(function(item) {
            saveAs(item, data.filename);
          });
          // var arr = new Uint8Array(data.rawdat);
          // var blob = new Blob([arr]);
          // saveAs(blob, data.filename);
        } else if (data.type === "file-chunk" || data.type === "file-chunk-last") {
          var name = data.name;
          if(meta[name] === undefined) {
            meta[name] = {
              need: 0,
              bool: false
            };
          }
          if(data.type === "file-chunk-last") {
            meta[name].bool = true;
            meta[name].want = data.order;
          }
          $localForage.setItem(data.order + "RECEIVED" + name, new Blob([new Uint8Array(data.data)])).then(function() {
            meta[name].need++;
            // To help with garbage collection.
            // delete data;
            // console.log('deleted data');
            if(meta[name].bool && (meta[name].want == (meta[name].need))) {
              $localForage.setItem("array_" + name, []).then(function(arr) {
                $localForage.iterate(function(val, key) {
                  if(key.indexOf("RECEIVED" + name) !== -1) {
                    arr[parseInt(key.slice(0, key.indexOf("RECEIVED"))) - 1] = val;
                    $localForage.removeItem(key);
                  }
                }).then(function() {
                  $localForage.setItem('bigblob_' + name, new Blob(arr))
                  .then(function(inner) {
                    saveAs(inner, name);
                  })
                  .then(function() {
                    $localForage.removeItem('bigblob_' + name);
                    $localForage.removeItem('array_' + name);
                  });
                });
              })
            }
          });
        } else {
          console.log('some edge case');
        }
      });
  }

  $scope.sendData = function(type) {
    if(Object.keys($scope.peers).length === 0) {
      return alert("Can't send data to no users!");
    }
    if(type === "message") {
      if($scope.message === "") {
        return alert("can't use no text");
      }
      var dataToSend = {
        rawdat: $scope.message,
        time: moment().format('h:mm:ss a'),
        name: $scope.username || "anonymous",
        type: "message"
      };
      PeerFactory.sendData(dataToSend, $scope.peers);
      $scope.messages.push(dataToSend);
      $scope.message = "";
    } else if (type === "file") {
      for(var x = 0; x < $scope.file.length; x++) {
        if($scope.file[x].size < (16 * 1024 * 1024)) {
          PeerFactory.sendData({
            rawdat: $scope.file[x],
            time: moment().format('h:mm:ss a'),
            name: $scope.username || "anonymous",
            filename: $scope.file[x].name,
            type: "file"
          }, $scope.peers);
          continue;
        }
        // Both assigns metadata required later and does the chunking
        var bool = false, want = 0;
        PeerFactory.chunker($scope.file[x], $scope.peers, function(name) {
          console.log("Completed chunking/sending of file " + name);
        });
      }
    } else {
      alert("you screwed up");
    }
  };
  $scope.isEnter = function(envent, func, arg){
    console.log("listening to keys");
    if(envent.keyCode===13){
      func.apply(null, arg);
    }
  }
  $scope.destroyPeer = function() {
    console.log("destroyed func!");
    console.log('before', $scope.me);
    $scope.me.destroy();
    console.log("after", $scope.me);
  };

  $scope.logPeers = function() {
    console.log("Peers:", $scope.peers);
  }

  $scope.logMe = function() {
    console.log($scope.me);
  }

  $scope.logLocalForage = function() {
    console.log("Logging Local Forage:")
    $localForage.iterate(function(val, key) {
      console.log("VAL", val);
      console.log("KEY", key);
    })
  }

  $scope.clearLocalForage = function() {
    $localForage.clear();
  }

  $window.onunload = function(e) {
    console.log("ON UNLOAD")
    $scope.me.destroy();
    $localForage.clear();
  };

  $scope.$watch('file', function (files, old) {
    if(files !== old) {
      $scope.sendData("file");
    }
  });

})