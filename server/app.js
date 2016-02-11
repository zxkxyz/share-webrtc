var http = require('http');

var nStatic = require('node-static');

var fileServer = new nStatic.Server('./public');

http.createServer(function (req, res) {
    
    fileServer.serve(req, res);

}).listen(5000);





// var express = require('express');
// var app = express();

// app.use(express.static('public'));

// //Serves all the request which includes /images in the url from Images folder
// app.use('/images', express.static(__dirname + '/Images'));

// var server = app.listen(5000);