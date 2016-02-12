angular.module('forinlanguages.services', [])

.factory('PeerFactory', function() {

  var makePeer = function(user) {
    user = new Peer({key: '6ph8w4mjh1cq5mi'});
    user.on('open', function(id) {
      console.log("Opened with ID:", id);
    });
    return user;
  }

  var handleConnection = function(c, peers) {
    if(peers[c.peer] !== undefined) {
      return console.log("Already connected?");
    }
    console.log("Will connect")
    c.on('data', function(data) {
      console.log(data);
      c.on('close', function() {
        console.log("User has disconnected");
        delete peers[c.peer];
      });
    });
    peers[c.peer] = "handleConnection";
  }

  var connectTo = function(person, peers, me) {
    var c = me.connect(person);
    return c;
  };

  return {
    makePeer: makePeer,
    handleConnection: handleConnection,
    connectTo: connectTo
  }
})
