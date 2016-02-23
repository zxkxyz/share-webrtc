angular.module('forinlanguages.services', [])

.factory('PeerFactory', function($localForage) {

  var makePeer = function(cb) {
    var newurl;
    var newPeer = new Peer({
      key: '6ph8w4mjh1cq5mi',
      debug: 0,
      logFunction: function() {
        var copy = Array.prototype.slice.call(arguments).join(' ');
        console.log(copy);
      }
    });
    newPeer.on('open', function(id) {
      console.log("Opened with ID:", id);
      cb(newPeer, id);
    });
  };

  var handleConnection = function(c, msgCb, peerCb, dataCb) {
    console.log("connection:", c);
    c.on('data', function(data) {
      console.log("Got data", data);
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
    console.log("Sending:", data);
    for(var x in peers) {
      peers[x].send(data);
    }
  };

  var chunker = function(data, peers, cb) {
    var chunkSize = 16 * 1024 * 1024;
    var meta = {
      totalChunks: Math.ceil(data.size/chunkSize),
      name: data.name,
      size: data.size,
    }

    var storeItem = function(prev, last) {
      $localForage.setItem(Math.floor((prev + chunkSize)/chunkSize) + "SENT" + meta.name, data.slice(prev, prev + chunkSize))
      .then(function(item) {
        // Send the chunk right after chunking it
        sendData({
          name: meta.name,
          order: Math.floor((prev + chunkSize)/chunkSize),
          data: item,
          type: "file-chunk"
        });
      })
      .then(function() {
        if((meta.size - (prev + chunkSize)) < chunkSize) {
          // If we're on the last chunk, save it
          $localForage.setItem(Math.ceil(meta.size/chunkSize) + '-LAST' + "SENT" + meta.name, data.slice(prev + chunkSize, meta.size))
          .then(function(lastItem) {
            // Trigger the callback because we're finished
            // debugger;
            sendData({
              name: meta.name,
              order: Math.ceil(meta.size/chunkSize),
              data: lastItem,
              type: "file-chunk-last"
            });
            // Let the caller know we've finished.
            return cb(meta.name);
          });
        } else {
          // Recurse and save next chunk
          storeItem(prev + chunkSize, false);
        }
      });
    };
    // Initial call of storeItem
    storeItem(0, false);
  };

  return {
    makePeer: makePeer,
    handleConnection: handleConnection,
    connectTo: connectTo,
    sendData: sendData,
    chunker: chunker
  }
})