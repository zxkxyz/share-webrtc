angular.module('forinlanguages.services', [])

.factory('PeerFactory', function() {

  var makePeer = function(user) {
    user = new Peer({
      key: '6ph8w4mjh1cq5mi'
    });
    user.on('open', function(id) {
      console.log("Opened with ID:", id);
    });
    return user;
  }

  var handleConnection = function(c, peers, messages) {
    if(peers[c.peer] !== undefined) {
      return console.log("That person is already connected!");
    }
    console.log("Will connect")
    c.on('data', function(data) {
      messages.push(data);
      console.log('received data', data);
      console.log("messages:", messages);
      c.on('close', function() {
        console.log('disconnected from person');
        delete peers[c.peer];
      });
    });
    peers[c.peer] = c;
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
