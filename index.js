"use strict";

class System{
    constructor(){
        this.ticketSeller = new Array();
        this.theatreShowing = new Array();
        this.sellerNames = new Array();
        this.movieNames = new Array();
        this.eventID = 0;
    }

    clearArrays(){
        this.ticketSeller = new Array();
        this.theatreShowing = new Array();
        this.sellerNames = new Array();
        this.movieNames = new Array();
        this.eventID = 0;
    }

    getSellersData(){
        return this.ticketSeller;
    }

    getTheatreData(){
        return this.theatreShowing;
    }

    printSystem(){
        return this.eventID;
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

    addEventSystem(eventType, data, addToAzure){
        var result = "lolo";
        //Add event to update real time view of system as well as event store once successful.
        if(eventType=="addSalesPerson"){
            system.ticketSeller.push({sellerName:data, numTicks:Number("0")});
            system.sellerNames.push(data);
            if(addToAzure){
                system.addEventAzure(data, eventType);
                system.eventID++;
            }
            else{
                system.eventID++;
            }

        }
        if(eventType=="addMovieTheatre"){
            system.theatreShowing.push({movieName:data, numTicks:Number("0")});
            system.movieNames.push(data);
            if(addToAzure){
                system.addEventAzure(data, eventType);
                system.eventID++;
            }
            else{
                system.eventID++;
            }
        }
        if(eventType=="addTicketSale"){
            var added = system.ticketSellerAddTickets(data.salesPerson, Number(data.tickets), data.movie);
            if(added){
                result = "Transaction performed successfully."
                if(addToAzure){
                    system.addEventAzure(data, eventType);
                    system.eventID++;
                }
                else{
                    system.eventID++;
                }
            }
            else{
                result = "Transaction was not performed."
            }
        }
        if(eventType=="removeTicketSale"){
            var removed = system.ticketSellerRemoveTickets(data.salesPerson, Number(data.tickets), data.movie);
            if(removed){
                result = "Transaction performed successfully."
                if(addToAzure){
                    system.addEventAzure(data, eventType);
                    system.eventID++;
                }
                else{
                    system.eventID++;
                }
            }
            else{
                result = "Transaction was not performed."
            }
        }
        return result;
    }

    addEventAzure(data, eventType){
        var entGen = azure.TableUtilities.entityGenerator;
        var event = {
            PartitionKey: entGen.String('theatreEvents'),
            RowKey: entGen.String(String(system.eventID)),
            data: JSON.stringify(data),
            eventType: eventType
        };
        tableSvc.insertEntity('events',event, function (error, result, response) {
            if(!error){
                //console.log(response);
            }
          });
    }

    processEventsFromAzure(){
        var query = new azure.TableQuery()
        .where('PartitionKey eq?','theatreEvents');
        tableSvc.queryEntities('events',query, null, function(error, result, response) {
            if(!error) {
                result.entries.forEach(function(element){
                    system.addEventSystem(element.eventType._, JSON.parse(element.data._), false);
                });
            }
        });
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

//Creation of table service.

var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
tableSvc.createTableIfNotExists('events', function(error, result, response){
    if(!error){
        //console.log(response);
    }
  });

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json()); 

app.use(expressValidator());

app.use(cors());

var system = new System();

    // Routing functionality of application.

    router.get('/refreshSystemMemory', function(req,res){
        system.processEventsFromAzure();
        res.json({message:"System now up-to-date with server."});
    });

    router.get('/wipeSystemMemory', function(req,res){
        system.clearArrays();
        res.json({message:"System arrays are reset."});
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
        var message = "";
        if(eventType=="buy"){
            message = system.addEventSystem("addTicketSale",data, true);
        }
        else{
            message = system.addEventSystem("removeTicketSale",data, true);
        }
        res.status(200);
        res.json({message:message});
    });

    // This route handles POST requests sent to the server containing the addition of events.
    router.post('/addTicketSeller', function (req, res){
        req.checkBody('ticketSeller', 'Invalid name').notEmpty().isAlpha();
        req.sanitizeBody('ticketSeller').escape();
        var newTicketSeller = req.body.ticketSeller;
        //Adding Seller to System.
        system.addEventSystem("addSalesPerson", newTicketSeller, true); 
        //Return request of all ticketSellers to populate view.
        res.status(200);
        res.json({message:"Sales Person Added Successfully.", allSellers:JSON.stringify(system.allSellers())});
    });

    router.post('/addMovieShowing', function (req, res){
        req.checkBody('movieShowing', 'Invalid name').notEmpty().isAlpha();
        req.sanitizeBody('movieShowing').escape();
        var newMovie = req.body.movieShowing;
        //Adding Movie to System.
        system.addEventSystem("addMovieTheatre", newMovie, true);
        //Return request of all movieTheatres to populate view.
        res.status(200);
        res.json({message:"Movie Theatre Added Successfully.", allTheatres:JSON.stringify(system.allTheatreShowings())});
    });

app.use('/', router);

app.listen(8000, function () {
    console.log('App Listening on Port: 8000');
});
