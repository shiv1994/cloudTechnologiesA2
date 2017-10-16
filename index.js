var express = require('express')
var app = express()
var router = express.Router();
var bodyParser = require('body-parser')

var path = __dirname + '/views/';

app.use('/', router);

app.use(bodyParser.urlencoded({
  extended: true
}));

var events = {};
var eventId = 0;

router.get('/',function(req, res){
  res.sendFile(path + 'index.html');
});

router.post('/saveEvent', function (req, res) {
  //  var person = req.param('PersonSelect');
  //  var theatre = req.param('TheatreSelct');
  //  var numTickets = req.param('NumTicksSelect');
  //  var event = {'person':person, 'theatre':theatre, 'numTickets':numTickets};
  //  events.eventId = event;
  //  eventId++;
   console.log(req.params);
   console.log(req.body);
})

app.listen(8000, function () {
  console.log('Example app listening on port 8000!');
})
