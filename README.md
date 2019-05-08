# SUPER NOTE: ALL OF YOUR GOOGLE VOICE MESSAGE HISTORY WILL BE DELETED WHEN THE LIBRARY IS USED.

Note: Only tested on Windows

Prerequisites:
1. Have Chrome 75 installed, or replace the WebDriver for the correct version
2. Have 2FA disabled for your GVoice account.

Basic Example:

```javascript
const { Client } = require("seleniumgvoice");
var client = new Client("gmail username", "gmail password");
client.events.on("init", () => {
    console.log("Ready");
    client.sendSMS("1234567890", "Hello World"); // Don't include country code
});

client.events.on("sms", (number, sms, time) => { // Number gets the country code added to it (8304765664 -> +18304765664)
    console.log(number, sms, time);
});

client.login(); // Do AFTER registering all events
```