angular.module('forinlanguages.services', [])

.factory('PeerFactory', function() {

  var makePeer = function(user, scope) {
    var newPeer = new Peer({
      key: '6ph8w4mjh1cq5mi'
    });
    newPeer.on('open', function(id) {
      console.log("Opened with ID:", id);
    });
      user = newPeer;
    };

  var handleConnection = function(c, peers, messages, scope) {
    if(peers[c.peer] !== undefined) {
      return console.log("That person is already connected!");
    }
    c.on('data', function(data) {
      messages.push(data);
      c.on('close', function() {
        delete peers[c.peer];
      });
    });
    peers[c.peer] = c;
    // Callback here
    console.log("peers", peers);
  }

  var connectTo = function(person, peers, me) {
    var c = me.connect(person, {
      metadata: {
        peers: peers
      }
    });
    return c;
  };

  var sendData = function(data, peers) {
    for(var x in peers) {
      peers[x].send(data);
    }
  }

  return {
    makePeer: makePeer,
    handleConnection: handleConnection,
    connectTo: connectTo,
    sendData: sendData
  }
})
