const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { EventEmitter } = require("events");

const MailListener = require("mail-listener4");


var prot = Client.prototype;

var seleniumOptions = new chrome.Options();
seleniumOptions.addArguments("--headless");
seleniumOptions.addArguments("--disable-gpu");

var driver = new Builder().forBrowser("chrome").setChromeOptions(seleniumOptions).build();
var msgBox;

var sending;
var queue = [];

function Client(email, password, number) {
    this._email = email;
    this._password = password;
    this._number = number;
    this.events = new EventEmitter();

    this._mailListener = new MailListener({
        username: email,
        password: password,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        fetchUnreadOnStart: true,
        searchFilter: ["UNSEEN", ["SINCE", new Date()]],
        markSeen: true
    });

    this._mailListener.start();
    this._mailListener.on("server:connected", function(){
    });
      
    this._mailListener.on("server:disconnected", function(){
    });

    this._mailListener.on("mail", (mail, seqno, attr) => {
        var from = mail.from[0].address;
        if(from.endsWith("@txt.voice.google.com")) {
            var regexp = new RegExp("<https://voice.google.com>\r\n.*\r\n");
            var eml = mail.eml;
            var matches = eml.match(regexp);
            var content = matches[0].split("\r\n").join("").replace("<https://voice.google.com>", "");

            var regexp2 = /[0-9]{11}/g;
            var matches2 = from.match(regexp2);
            var toNumber = matches2[1];

            this.events.emit("sms", toNumber, content);
        }
    });
}

prot.setNumber = async function(number) {
    queue = [];
    var sendMsgButon = await locationPromiseByXPath("//*[@id=\"messaging-view\"]/div/md-content/div/div/div");
    await sendMsgButon.click();

    var toField = await locationPromiseByXPath("//*[@id=\"input_0\"]");
    await driver.wait(until.elementIsEnabled(toField));
    await toField.sendKeys(number, Key.RETURN);

    msgBox = await locationPromiseByXPath("//*[@id=\"input_1\"]"); // Find the message box
    await driver.wait(until.elementIsEnabled(msgBox));
}

prot.login = async function() {
    await driver.get("https://voice.google.com");
    await driver.findElement(By.className("signUpLink")).click();
    await driver.wait(until.titleIs("Google Voice"));
    await driver.findElement(By.name("Email")).sendKeys(this._email, Key.RETURN);

    var passfield = await locationPromiseByName("Passwd"); // Find the passworld field and wait until it is visible
    await visibilityPromise(passfield);
    await passfield.sendKeys(this._password, Key.RETURN);

    var msgButton = await locationPromiseByXPath("//*[@id=\"gvPageRoot\"]/div[2]/div[2]/gv-side-nav/div/div/gmat-nav-list/a[2]"); // Find the message button
    await visibilityPromise(msgButton);
    await msgButton.click();

    var convo = await locationPromiseByXPath("//*[@id=\"messaging-view\"]/div/md-content/div/gv-conversation-list/md-virtual-repeat-container/div/div[2]/div/div/gv-text-thread-item"); // Find my phone number
    await visibilityPromise(convo);

    var sendMsgButon = await locationPromiseByXPath("//*[@id=\"messaging-view\"]/div/md-content/div/div/div");
    await sendMsgButon.click();

    var toField = await locationPromiseByXPath("//*[@id=\"input_0\"]");
    await driver.wait(until.elementIsEnabled(toField));
    await toField.sendKeys(this._number, Key.RETURN);

    msgBox = await locationPromiseByXPath("//*[@id=\"input_1\"]"); // Find the message box
    await driver.wait(until.elementIsEnabled(msgBox));

    setInterval(tick, 100);
    this.events.emit("init");
}

function tick() {
    if(!sending) {
        if(queue[0]) {
            sending = true;
            sendSMS(queue[0]);
            queue.shift();
        }
    }
}

prot.sendSMS = function(msg) {
    queue.push(msg);
}

async function sendSMS(msg) {
    var split = msg.split("\n");
    for(i = 0; i < split.length; i++) {
        if(i === split.length - 1) {
            await msgBox.sendKeys(split[i]);
            await msgBox.sendKeys(Key.chord(Key.SHIFT, "\n"), Key.RETURN);
        } else {
            await msgBox.sendKeys(split[i]);
            await msgBox.sendKeys(Key.chord(Key.SHIFT, "\n"));
        }
    }
    sending = false;
}

function locationPromiseByName(name) {
    return driver.wait(until.elementLocated(By.name(name)));
}

function locationPromiseByXPath(xpath) {
    return driver.wait(until.elementLocated(By.xpath(xpath)));
}

function visibilityPromise(el) {
    return driver.wait(until.elementIsVisible(el));
}

module.exports = Client;