Note: Only tested on Windows

Prerequisites:
1. Have Chrome 75 installed, or replace the WebDriver for the correct version
2. Have Google Voice set up with at least one SMS conversation and with messages forwarding to your email account.
3. Have 2FA disabled for your GVoice account.

Basic Example:

```javascript
const { Client } = require("seleniumgvoice");
var client = new Client("gmail username", "gmail password", "inital number to SMS");
client.events.on("init", () => {
    console.log("Ready");
    client.sendSMS("Hello World");
    client.setNumber("1234567890");
    client.sendSMS("Hello World");
});

client.events.on("sms", (number, sms) => { // Number gets the country code added to it (8304765664 -> 18304765664)
    console.log(number, sms);
});

client.login(); // Do AFTER registering all events
```