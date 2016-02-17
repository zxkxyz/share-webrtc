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
        var bool = false;
        console.log("The data I get", data);
        if(data.type === "file") {
          var arr = new Uint8Array(data.rawdat);
          var blob = new Blob([arr]);
          var blobUrl = window.URL.createObjectURL(blob);
          $scope.files.push(blobUrl);
          $scope.$digest();
          saveAs(blob, data.filename);
        } else if (data.type === "file-chunk" || data.type === "file-chunk-last") {
          var bool = false;
          $localForage.setItem(data.order + data.name, data.data).then(function() {
            if(data.type === "file-chunk-last") {
              bool = true;
              var want = data.order;
            }
            var need = 0
            if(bool) {
              console.log("IF BOOL");
              var arr = [];
              $localForage.iterate(function(val, key) {
                if(key.indexOf(data.name) !== -1) {
                  need++;
                  var toPush = {order: key, data: val};
                  console.log("toPush", toPush);
                  arr.push(toPush);
                  console.log("arr", arr);
                }
              }).then(function() {
                console.log("ARR", arr);
                console.log("NEED", need);
                console.log("WANT", want);
                console.log((need-1) == want);
                if((need-1) == want) {
                  console.log('we got in here');
                  arr = _.sortBy(arr, 'order');
                  console.log('sorted array', arr);
                  var justBlobs = [];
                  for(var x = 0; x < arr.length; x++) {
                    var intarr = new Uint8Array(arr[x].data);
                    var blob = new Blob([intarr]);
                    justBlobs.push(blob);
                  }
                  var bigBlob = new Blob(justBlobs);
                  saveAs(bigBlob, data.name);
                  $localForage.clear(function() {
                    console.log("Cleared localforage");
                  })
                }
              });
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
      $scope.messages.push("" + dataToSend.time + " - " + dataToSend.name + ": " + dataToSend.rawdat);
    } else if (type === "file") {
      console.log("File selected:", $scope.file[0]);
      if($scope.file.size < (5 * 1000 * 1000)) {
        return PeerFactory.sendData($scope.file[0], $scope.peers);
      }
      // Both assigns metadata required later and does the chunking
      var bool = false, want = 0;
      PeerFactory.chunker($scope.file[0], function(dat, meta) {
        console.log("chunker returned", dat);
        var order = dat.order;
        if(dat.type === "file-chunk-last") {
          order = dat.order + "-LAST";
        }
        $localForage.setItem(order, dat.data).then(function() {
          // Only start checking once we reach the last file chunk, it's a-sync so we have to set up the bool just in case
          // we get the last file chunk right before adding another chunk if that makes any sense lololol
          if(dat.type === "file-chunk-last") {
            console.log("landed on last chunk")
            bool = true;
            want = dat.order;
          }
          var have = 0;
          console.log('testing bool', bool);
          if(bool) {
            $localForage.iterate(function(val,key) {
              console.log("outer key", key);
              console.log("ITERATING OVER:", val);
              have++;
            }).then(function() {
              console.log("have", have);
              console.log("Want", want);
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
      $localForage.clear(function() {
        console.log("Cleared local forage");
      });
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

  $window.onunload = $window.onbeforeunload = function(e) {
    $scope.me.destroy();
    $localForage.clear(function() {
      console.log("Cleared local forage");
    });
  };

  $scope.$watch('file', function (files, old) {
    if(files !== old) {
      $scope.sendData("file");
    }
  });

})