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
                if(el.numTicks + tickets <= 200){
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
                if(el.numTicks - tickets >= 0){
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

    addEventSystemAzure(eventType, data, addToAzure){
        var added = false;
        if(eventType=="addSalesPerson"){
            system.ticketSeller.push({sellerName:data, numTicks:Number("0")});
            system.sellerNames.push(data);
            added = true;
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
            added = true;
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
                added = true;
                if(addToAzure){
                    system.addEventAzure(data, eventType);
                    system.eventID++;
                }
                else{
                    system.eventID++;
                }
            }
            else{
                added = false;
            }
        }
        if(eventType=="removeTicketSale"){
            var removed = system.ticketSellerRemoveTickets(data.salesPerson, Number(data.tickets), data.movie);
            if(removed){
                added = true;
                if(addToAzure){
                    system.addEventAzure(data, eventType);
                    system.eventID++;
                }
                else{
                    system.eventID++;
                }
            }
            else{
                added = false;
            }
        }
        return added;
    }

    addEventAzure(data, eventType){
        var entGen = azure.TableUtilities.entityGenerator;
        var event = {
            PartitionKey: entGen.String('theatreEvents2'),
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

    processEventsFromAzure(fun){
        var query = new azure.TableQuery().where('PartitionKey eq?','theatreEvents2');

        return tableSvc.queryEntities('events',query, null, function(error, result, response) {
            if(!error) {
                result.entries.forEach(function(element){
                    system.addEventSystemAzure(element.eventType._, JSON.parse(element.data._), false);
                });
                var res2 = fun();
                console.log("res2", res2);
                return res2;
            }
        });
   
    }

    processEventsFromAzureNoCallback(){
        var query = new azure.TableQuery()
        .where('PartitionKey eq?','theatreEvents2');
        tableSvc.queryEntities('events',query, null, function(error, result, response) {
            if(!error) {
                result.entries.forEach(function(element){
                    system.addEventSystemAzure(element.eventType._, JSON.parse(element.data._), false);
                });
                //Update Materalized View
                updateClients();
            }
        });
    }

    verifyAndUpdateEventStore(eventType, data, addToAzure){
        //Clear server's data.
        system.clearArrays();
        //Rebuilding Event Store From Azure.
        var res = system.processEventsFromAzure(
            ()=>{
                var successful = false;
                //Add event to system's current view.
                if(system.addEventSystemAzure(eventType, data, true)==true){
                    successful = true;
                    //Clear server's data again.
                    system.clearArrays();
                    //Rebuilding Event Store From Azure.
                    system.processEventsFromAzureNoCallback();
                }
                return successful;
            }
        );
        console.log("res", res);
        return res;
    }

}

// Creation of Global Variables.

    var connections = [];

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
            //console.log(response);
        }
    });


// Uses within applications.

    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(bodyParser.json()); 

    app.use(expressValidator());

    app.use(cors());

// MiddleWare used for linking client to server.
    function sse(req, res, next) {
        res.sseSetup = function() {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
        }
    
        res.sseSend = function(data) {
            res.write("data: " + JSON.stringify(data) + "\n\n");
        }
    
        next();
    }

app.use(sse);

let updateClients = () => {
    var data = {sellers: system.getSellersData(), theatres:system.getTheatreData()};
    connections.forEach(conn=> conn.sseSend(data));
}

var system = new System();


// Routing functionality of application.
    router.get('/refreshSystemMemory', function(req,res){
        system.processEventsFromAzureNoCallback();
        //setTimeout(updateClients, 2000);
        res.json({message:"System now up-to-date with server."});
    });

    router.get('/wipeSystemMemory', function(req,res){
        system.clearArrays();
        updateClients();
        res.json({message:"System arrays are reset."});
    });
        
    router.get('/systemStatus', function(req,res){
        // var theatreData = system.getTheatreData();
        var sellerData = system.getSellersData();
        res.sseSetup();
        res.sseSend(sellerData);
        connections.push(res);
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
        var messageResponse = "Ticket Transaction Completed Successfully";
        if(eventType=="buy"){
            if(system.verifyAndUpdateEventStore("addTicketSale", data, true)==false){
                messageResponse = "Ticket Transaction Not Completed Successfully";
            }
        }
        else{
            var rsult = system.verifyAndUpdateEventStore("removeTicketSale", data, true);
            console.log("FUCK ->"+rsult);
            if(rsult==false){
                console.log("FUCKKK");
                messageResponse = "Ticket Transaction Not Completed Successfully";
            }
        }
        res.status(200);
        res.json({message:messageResponse});
    });

    // This route handles POST requests sent to the server containing the addition of events.
    router.post('/addTicketSeller', function (req, res){
        req.checkBody('ticketSeller', 'Invalid name').notEmpty().isAlpha();
        req.sanitizeBody('ticketSeller').escape();
        var newTicketSeller = req.body.ticketSeller;
        var messageResponse = "Seller Added Successfully";
        //Adding Seller to System.
        if(system.verifyAndUpdateEventStore("addSalesPerson", newTicketSeller, true)==false){
            messageResponse = "Seller Not Added Successfully.";
        }
        res.status(200);
        res.json({message: messageResponse, allSellers:JSON.stringify(system.allSellers())});
    });

    router.post('/addMovieShowing', function (req, res){
        req.checkBody('movieShowing', 'Invalid name').notEmpty().isAlpha();
        req.sanitizeBody('movieShowing').escape();
        var newMovie = req.body.movieShowing;
        var messageResponse = "Movie Added Successfully";
        //Adding Movie to System.
        if(system.verifyAndUpdateEventStore("addMovieTheatre", newMovie, true)==false){
            messageResponse = "Movie Not Added Successfully.";
        }
        res.status(200);
        res.json({message:messageResponse, allTheatres:JSON.stringify(system.allTheatreShowings())});
    });

app.use('/', router);

app.listen(8000, function () {
    console.log('App Listening on Port: 8000');
});
