angular.module('forinlanguages.services', [])

.factory('PeerFactory', function() {

  var makePeer = function(cb) {
    var newurl;
    var newPeer = new Peer({
      key: '6ph8w4mjh1cq5mi'
    });
    newPeer.on('open', function(id) {
      console.log("Opened with ID:", id);
      cb(newPeer, id);
    });
  };

  var handleConnection = function(c, msgCb, peerCb, dataCb) {
    console.log("connection:", c);
    c.on('data', function(data) {
      console.log("data:", data);
      if(data.type === "message") {
        msgCb(data);
      } else if(data.type === "file") {
        console.log("it's a file!");
        dataCb(data);
      } else {
        console.log("something happened");
      }
    });
    c.on('close', function() {
      peerCb(c);
    });
    peerCb(c);
  };

  var connectTo = function(person, me) {
    var c = me.connect(person);
    return c;
  };

  var sendData = function(data, peers) {
    for(var x in peers) {
      peers[x].send(data);
    }
  };

  return {
    makePeer: makePeer,
    handleConnection: handleConnection,
    connectTo: connectTo,
    sendData: sendData
  }
})