"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

bot.dialog('/', [
    //Default bot message function
    /*
    function (session) {
        session.send('You said ' + session.message.text);
    }
    */
    
    //Guided or "waterfall" conversation
    function(session) {
        session.beginDialog('/takeOrder', session.conversationData.orderInfo);
    },
    function(session, results) {
        session.conversationData.orderInfo = results.response;
        session.send("Ok! Placing your order for a %(foodVersion)s %(foodType)s!", session.conversationData.orderInfo);
    }
]);

//Order waterfall
bot.dialog('/takeOrder', [
    function(session) {
        builder.Prompts.text(session, "What kind of food would you like to order (sandwich, salad)?");
    },
    function(session, results) {
        session.dialogData.orderInfo = {};
        session.dialogData.orderInfo.foodType = results.response;
        if (session.dialogData.orderInfo.foodType == 'sandwich') {
            builder.Prompts.text(session, 'Ok! What type of sandwich would you like (club, reuben)?');
        }
        else if (session.dialogData.orderInfo.foodType == 'salad') {
            builder.Prompts.text(session, "Ok! What type of salad would you like (cobb, caesar)?");
        }
        else {
            session.send("I'm sorry, I don't have that available :(");
        }
    },
    function(session, results) {
        session.dialogData.orderInfo.foodVersion = results.response;
        session.endDialogWithResult({ response: session.dialogData.orderInfo});
    }
]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
