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
          var arr = new Uint8Array(data.rawdat);
          var blob = new Blob([arr]);
          var blobUrl = window.URL.createObjectURL(blob);
          $scope.files.push(blobUrl);
          $scope.$digest();
          saveAs(blob, data.filename);
        } else if (data.type === "file-chunk" || data.type === "file-chunk-last") {
          if(meta[data.name] === undefined) {
            meta[data.name] = {};
            meta[data.name].need = 0;
            meta[data.name].bool = false;
          }
          if(data.type === "file-chunk-last") {
            meta[data.name].bool = true;
            meta[data.name].want = data.order;
          }
          var intarr = new Uint8Array(data.data);
          var blob = new Blob([intarr]);
          $localForage.setItem(data.order + data.name, blob).then(function(val) {
            meta[data.name].need++;
            if(meta[data.name].bool) {
              if(meta[data.name].want == (meta[data.name].need - 1)) {
                $localForage.setItem("array_" + data.name, []).then(function(arr) {
                  $localForage.iterate(function(val, key) {
                    if(key.indexOf(data.name) !== -1) {
                      arr[parseInt(key.slice(0, key.indexOf(data.name)))] = val;
                    }
                  }).then(function() {
                    $localForage.setItem('bigblob_' + data.name, new Blob(arr)).then(function(inner) {
                      saveAs(inner, data.name);
                    });
                  });
                })
              }
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
    } else if (type === "file") {
      for(var x = 0; x < $scope.file.length; x++) {
        if($scope.file.size < (5 * 1000 * 1000)) {
          return PeerFactory.sendData($scope.file[x], $scope.peers);
        }
        // Both assigns metadata required later and does the chunking
        var bool = false, want = 0;
        PeerFactory.chunker($scope.file[x], function(dat, meta) {
          var order = dat.order;
          if(dat.type === "file-chunk-last") {
            order = dat.order + "-LAST";
          }
          $localForage.setItem(order, dat.data).then(function() {
            // Only start checking once we reach the last file chunk, it's a-sync so we have to set up the bool just in case
            // we get the last file chunk right before adding another chunk if that makes any sense lololol
            if(dat.type === "file-chunk-last") {
              bool = true;
              want = dat.order;
            }
            var have = 0;
            if(bool) {
              $localForage.iterate(function(val,key) {
                have++;
              }).then(function() {
                if((have-1) === want) {
                  $localForage.iterate(function(val,key) {
                    if(key.indexOf("LAST") !== -1) {
                      PeerFactory.sendData({name: meta.name, order: key.slice(0, key.indexOf("-LAST")), data: val, type: "file-chunk-last"}, $scope.peers);
                    } else {
                      PeerFactory.sendData({name: meta.name, order: key, data: val, type: "file-chunk"}, $scope.peers);
                    }
                  });
                }
              })
            }
          });
        });
        $localForage.clear();
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