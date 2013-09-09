var xmpp = require("node-xmpp");
var request = require("request");
var nconf = require("nconf");
var cons = require("consolidate");
var express = require("express");

var app = express();

nconf.use("file", {
    file: "./config.json"
});

function create_room(room_jid, room_name, cb){
    // Establish a connection
    var conn = new xmpp.Client(nconf.get("account"));
    
    conn.on("online", function(){
        var room_presence = new xmpp.Element("presence", { 
            to: room_jid + "@muc.localhost/" + (nconf.get("account:jid")).split("@")[0] 
        }).c('x', { xmlns: 'http://jabber.org/protocol/muc' });
        
        var room_iq = new xmpp.Element('iq', { to: room_jid + "@muc.localhost", type: 'set' }).
                c("query", { xmlns : 'http://jabber.org/protocol/muc#owner'}).
                c("x", { xmlns:"jabber:x:data", type:"submit" }).
                c("field", { "var":'muc#roomconfig_roomname' }).
                c("value").
                t(room_name);
        
        console.log("We're online!");
        // Set client's presence
        conn.send(new xmpp.Element("presence", { type: "available" }).c("show").t("chat"));
        // Send new room's presence
        conn.send(room_presence);
        // Set room's name
        conn.send(room_iq);
        //conn.end();
        
        cb();
    });
}

app.configure(function(){
    app.use("/", express.static(__dirname));
	app.use(express.bodyParser());
	app.use(app.router);
});

app.get("/", function(reqP, resP){
	cons.swig("./main.html",{},function(err,html){
		resP.writeHead(200, {"Content-Type" : "text/html"});
		resP.end(html);
	});
});

app.post("/", function(reqP, resP){
    var room_jid = reqP.body.room_jid;
    var room_name = reqP.body.room_name;
    
    console.log("PARAMS: "+room_jid+"   "+room_name);
    create_room(room_jid, room_name, function(){
        resP.json(200, {"message" : "OK"});
    });
});

app.listen(nconf.get("app:port"), nconf.get("app:host"));var nconf = require("nconf");