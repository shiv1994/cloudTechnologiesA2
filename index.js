"use strict";

class System{
    constructor(){
        this.ticketSeller = new Array();
        this.theatreShowing = new Array();
        this.events = new Array();
    }

    allSellers(){
        return this.ticketSeller;
    }
}

function determineAndAddEvent(eventType, data){
    //Add to Event Store
    //addEvent(eventType, timeStamp, data);
    
    //Add event to update real time view of system.
    if(eventType=="addSalesPerson"){
        system.ticketSeller.push(data);
    }
    if(eventType=="addMovieTheatre"){
        theatreShowing.push(data.theatreShowing);
    }
    if(eventType=="addTicketSale"){
        //Find theatre and add num tickets in request.
    }
    if(eventType=="removeTicketSale"){
        //Find theatre and add num tickets in request.
    }
}

// Creation of Global Variables.

var cors = require('cors')

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

app.use(cors());

var system = new System();

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
    });

    // This route handles POST requests sent to the server containing the addition of events.
    router.post('/addTicketSeller', function (req, res){
        req.checkBody('ticketSeller', 'Invalid name').notEmpty().isAlpha();
        req.sanitizeBody('ticketSeller').escape();
        var newTicketSeller = req.body.ticketSeller;
        //Adding Seller to System.
        determineAndAddEvent("addSalesPerson", newTicketSeller); 
        //Return request of all ticketSellers to populate view.
        // res.status(200);
        res.send(JSON.stringify(system.allSellers()));
    });

    router.post('/addMovieShowing', function (req, res){
        req.checkBody('movieShowing', 'Invalid name').notEmpty().isAlpha();
        req.sanitizeBody('movieShowing').escape();
        var newMovie = req.body.movieShowing;
        //Adding Movie to System
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
