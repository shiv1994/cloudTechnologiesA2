"use strict";

class System{
    constructor(){
        this.ticketSeller = new Array();
        this.theatreShowing = new Array();
        this.events = new Array();
        this.sellerNames = new Array();
        this.movieNames = new Array();
        this.eventID = 0;
    }

    clearArrays(){
        this.ticketSeller = new Array();
        this.theatreShowing = new Array();
        this.events = new Array();
        this.sellerNames = new Array();
        this.movieNames = new Array();
    }

    getSellersData(){
        return this.ticketSeller;
    }

    getTheatreData(){
        return this.theatreShowing;
    }

    printSystem(){
        console.log(this.events);
    }

    allSellers(){
        return this.sellerNames;
    }

    allTheatreShowings(){
        return this.movieNames;
    }

    ticketSellerAddTickets(sellerName, tickets, movieName){
        var added = false;
        this.theatreShowing.forEach(function(el){
            if(el.movieName==movieName){
                if(el.numTicks<200){
                    el.numTicks += tickets;
                    added = true;
                }
            }
        });
        if(added){
            this.ticketSeller.forEach(function(el){
                if(el.sellerName == sellerName)
                    el.numTicks += tickets;
            });
        }
        return added;
    }

    ticketSellerRemoveTickets(sellerName, tickets, movieName){
        var removed = false;
        this.theatreShowing.forEach(function(el){
            if(el.movieName==movieName){
                if(el.numTicks>0+tickets){
                    el.numTicks -= tickets;
                    removed = true;
                }
            }
        });
        if(removed){
            this.ticketSeller.forEach(function(el){
                if(el.sellerName == sellerName)
                    el.numTicks -= tickets;
            });
        }
        return removed;
    }

    addEvent(eventType, data){

        //Add event to update real time view of system as well as event store once successful.
        if(eventType=="addSalesPerson"){
            system.ticketSeller.push({sellerName:data, numTicks:Number("0")});
            system.sellerNames.push(data);
            system.events.push({id:system.eventID++, timestamp:Date.now(), data:data, eventType:eventType});
            addEventAzure(data, eventType);

        }
        if(eventType=="addMovieTheatre"){
            system.theatreShowing.push({movieName:data, numTicks:Number("0")});
            system.movieNames.push(data);
            system.events.push({id:system.eventID++, timestamp:Date.now(), data:data, eventType:eventType});
        }
        if(eventType=="addTicketSale"){
            var added = system.ticketSellerAddTickets(data.salesPerson, Number(data.tickets), data.movie);
            if(added){
                system.events.push({id:system.eventID++, timestamp:Date.now(), data:data, eventType:eventType});
            }
        }
        if(eventType=="removeTicketSale"){
            var removed = system.ticketSellerRemoveTickets(data.salesPerson, Number(data.tickets), data.movie);
            if(removed){
                system.events.push({id:system.eventID++, timestamp:Date.now(), data:data, eventType:eventType});
            }
        }
        system.printSystem();
    }

    processEvents(){
        this.events.forEach(function(event){
            addEvent(event.eventType, eventType.data);
        });
        printSystem();
    }
}

// Creation of Global Variables.

var AZURE_STORAGE_ACCOUNT = "comp69052017a215";

var AZURE_STORAGE_ACCESS_KEY = "vbqqOZAqYl4pHlUjg7QNaZ0NK6bvuoipxTfsXPaFVRKnhHZPXHj+mejFUCXW5V2rIGorIZlkWsb8cltJn2S5+Q==";

var cors = require('cors')

var express = require('express')

var bodyParser = require('body-parser')

var expressValidator = require('express-validator');

var azure = require('azure-storage');

var router = express.Router();

var app = express();

var path = __dirname + '/views/';

var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
tableSvc.createTableIfNotExists('events', function(error, result, response){
    if(!error){
        console.log(response);
    }
  });

function addEventAzure(data, eventType){
    var entGen = azure.TableUtilities.entityGenerator;
    var event = {
        PartitionKey: entGen.String('theatreEvents'),
        RowKey: entGen.String('1-10'),
        data: JSON.stringify(data),
        eventType: eventType
    };
    tableSvc.insertEntity('events',event, function (error, result, response) {
        if(!error){
            console.log(response);
        }
      });
}

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json()); 

app.use(expressValidator());

app.use(cors());

var system = new System();

    // Routing functionality of application.

    router.get('/refreshSystemMemory', function(req,res){
        system.processEvents();
    });

    router.get('/wipeSystemMemory', function(req,res){
        system.clearArrays();
    });

    router.get('/systemStatus', function(req,res){
        res.json({theatreShowings: system.getTheatreData(), sellers:system.getSellersData()});
    });

    // This route is used to display the homepage where all functionality can be carried out.
    router.get('/',function(req, res){
        res.sendFile(path + 'index.html');
    });

    // This route handles POST requests sent to the server containing the addition of events.
    router.post('/recordTransaction', function (req, res){
        // Ensuring input exists.
        req.checkBody('movie', 'Invalid name').notEmpty().isAlpha();
        req.checkBody('tickets', 'Invalid name').notEmpty().isAlpha();
        req.checkBody('salesPerson', 'Invalid name').notEmpty().isInt();
        req.checkBody('transType', 'Invalid name').notEmpty().isAlpha();
        // Sanitizing parameters in the body.
        req.sanitizeBody('movie').escape();
        req.sanitizeBody('tickets').escape();
        req.sanitizeBody('salesPerson').escape();
        req.sanitizeBody('transType').escape();
        // Adding Event To System.
        var data = {movie:req.body.movie, salesPerson:req.body.salesPerson, tickets:req.body.tickets}; 
        var eventType = req.body.transType;
        if(eventType=="buy"){
            system.addEvent("addTicketSale",data);
        }
        else{
            system.addEvent("removeTicketSale",data);
        }
        res.redirect('/');
    });

    // This route handles POST requests sent to the server containing the addition of events.
    router.post('/addTicketSeller', function (req, res){
        req.checkBody('ticketSeller', 'Invalid name').notEmpty().isAlpha();
        req.sanitizeBody('ticketSeller').escape();
        var newTicketSeller = req.body.ticketSeller;
        //Adding Seller to System.
        system.addEvent("addSalesPerson", newTicketSeller); 
        //Return request of all ticketSellers to populate view.
        res.status(200);
        res.json({message:"Sales Person Added Successfully.", allSellers:JSON.stringify(system.allSellers())});
    });

    router.post('/addMovieShowing', function (req, res){
        req.checkBody('movieShowing', 'Invalid name').notEmpty().isAlpha();
        req.sanitizeBody('movieShowing').escape();
        var newMovie = req.body.movieShowing;
        //Adding Movie to System.
        system.addEvent("addMovieTheatre", newMovie);
        //Return request of all movieTheatres to populate view.
        res.status(200);
        res.json({message:"Movie Theatre Added Successfully.", allTheatres:JSON.stringify(system.allTheatreShowings())});
    });

app.use('/', router);

app.listen(8000, function () {
    console.log('App Listening on Port: 8000');
});
