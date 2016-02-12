// var http = require('http');

// var nStatic = require('node-static');

// var fileServer = new nStatic.Server('./public');

// http.createServer(function (req, res) {
    
//     fileServer.serve(req, res);

// }).listen(5000);





var express = require('express');
var bodyParser = require('body-parser');


var app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use('views', __dirname + '/client');
var port = process.env.PORT || 3000

app.use(express.static(__dirname+'/client'));

app.get('/', function (req, res){
	//res.render('index');
	res.send('hello')
})
//Serves all the request which includes /images in the url from Images folder
//app.use('/images', express.static(__dirname + '/Images'));

var server = app.listen(port);

console.log('Sever is now listening on port '+ port);