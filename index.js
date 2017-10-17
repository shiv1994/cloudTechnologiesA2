var express = require('express')

var bodyParser = require('body-parser')

var router = express.Router();

var app = express();

var path = __dirname + '/views/';

var events = [];

var eventId = 0;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json()); 

router.get('/',function(req, res){
    res.sendFile(path + 'index.html');
});

//Types of Events: Add Movie Sale, Remove Movie Sale, Possibly Add Movie Ticket Sellers.

router.post('/saveEvent', function (req, res){
    var person = req.body.PersonSelect;
    var theatre = req.body.TheatreSelct;
    var numTickets = req.body.NumTicksSelect;
    var transType = req.body.TransType;
    var event = {'person':person, 'theatre':theatre, 'numTickets':numTickets, 'transType':transType};
    events.push(event);
    eventId++;
    res.sendFile(path + 'index.html');
    console.log(events);
});

app.use('/', router);

app.listen(8000, function () {
    console.log('Example app listening on port 8000!');
});

function processEvents(){
    events.forEach(function(element) {
        //Firstly need to check from the last snapshot point, if any exists.
        //If it does exist, we can start from that particular snapshot.
        //We may model the snapshot like this: snapshot={snapshotId, theater:{t1:500, t2:1000}, personsSelling:{Names of Persons}}
    }, this);
}

setInterval(processEvents, 10000);
