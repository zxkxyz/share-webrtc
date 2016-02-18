angular.module('forinlanguages.services', [])

.factory('PeerFactory', function($localForage) {

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
      if(data.type === "message") {
        msgCb(data);
      } else if(data.type === "file") {
        dataCb(data);
      } else if(data.type === "file-chunk" || data.type === "file-chunk-last") {
        dataCb(data);
      } else {
        console.log("invalid data type", data);
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
    console.log('sending this', data);
    for(var x in peers) {
      peers[x].send(data);
    }
  };

  var chunker = function(data, cb) {
    var chunkSize = 16 * 1000 * 1000;
    var meta = {
      totalChunks: Math.ceil(data.size/chunkSize),
      name: data.name,
      size: data.size,
    }
    console.log("chunker", data);
    console.log("size of data", data.size);
    var prev = 0;
    var x = 0;
    for(; x < Math.floor(data.size/chunkSize); x++) {
      var block = data.slice(prev, prev + chunkSize);
      console.log("Block", block);
      var dat = {data: block, order: x, name: data.name, type: "file-chunk"};
      console.log("dat", dat);
      cb(dat, meta);
      prev += chunkSize;
    }
    var dat = {data: data.slice(prev, data.size), order: x, name: data.name, type: "file-chunk-last"};
    cb(dat, meta);
    console.log("Data size:", data.size);
  };

  return {
    makePeer: makePeer,
    handleConnection: handleConnection,
    connectTo: connectTo,
    sendData: sendData,
    chunker: chunker
  }
})