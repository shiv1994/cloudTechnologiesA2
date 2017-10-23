"use strict";

// class System{
    // 
// }

// class Seller {
//     constructor(name) {
//       this.name = name;
//     }
//     get sellerName(){
//       return this.name;
//     }
// }

// class Theatre {
//     constructor(transType, ) {
//       this.name = name;
//     }
//     get sellerName(){
//       return this.name;
//     }
// }

// Creation of Global Variables.

var express = require('express')

var bodyParser = require('body-parser')

var expressValidator = require('express-validator');

var router = express.Router();

var app = express();

var path = __dirname + '/views/';

var events = [];

var eventId = 0;

// Adding features to the main application vatiable.

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json()); 

app.use(expressValidator());

// var system = new System();

// Routing functionality of application.

    // This route is used to display the homepage where all functionality can be carried out.
    router.get('/',function(req, res){
        res.sendFile(path + 'index.html');
    });

    // This route handles POST requests sent to the server containing the addition of events.
    router.post('/saveEvent', function (req, res){
        // Ensuring input exists.
        req.checkBody('PersonSelect', 'Invalid name').notEmpty().isAlpha();
        req.checkBody('TheatreSelct', 'Invalid name').notEmpty().isAlpha();
        req.checkBody('NumTicksSelect', 'Invalid name').notEmpty().isInt();
        req.checkBody('TransType', 'Invalid name').notEmpty().isAlpha();
        // Sanitizing parameters in the body.
        req.sanitizeBody('PersonSelect').escape();
        req.sanitizeBody('TheatreSelct').escape();
        req.sanitizeBody('NumTicksSelect').escape();
        req.sanitizeBody('TransType').escape();
        // Building the event and storing it in an array for the time being.
        var event = {'timestamp':Date.now(), 'transType':req.body.TransType, 'person':req.body.PersonSelect, 'theatre':req.body.TheatreSelct, 'numTickets':req.body.NumTicksSelect};
        events.push(event);
        // system.processEvent();
        eventId++;
        res.redirect('/');
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

// setInterval(processEvents, 10000);
