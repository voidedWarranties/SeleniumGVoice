var Client = require("./Client.js");

var client = new Client("email", "pass", "8304765664");
var events = client.getEvents();
events.on("init", () => {
    console.log("ready");
    // client.sendSMS("test");
    // client.setNumber("");
    // client.sendSMS("test2");
});
events.on("sms", m => {
    console.log(m);
});
client.login();