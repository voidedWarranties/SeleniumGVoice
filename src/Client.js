const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { EventEmitter } = require("events");

const parseString = require("xml2js").parseString;

const request = require("request");

var prot = Client.prototype;

var seleniumOptions = new chrome.Options();
seleniumOptions.addArguments("--headless");
seleniumOptions.addArguments("--disable-gpu");

var driver = new Builder().forBrowser("chrome").setChromeOptions(seleniumOptions).build();

var cookie, _rnr_se;

var events;

function Client(email, password) {
    this._email = email;
    this._password = password;
    this.events = new EventEmitter();
    events = this.events;
}

var requesting;
var deleting;
var previousLatest;

function getNew() {
    if(requesting || deleting) return;
    requesting = true;
    request({
        method: "GET",
        uri: "https://www.google.com/voice/inbox/recent/sms/",
        headers: {
            cookie
        }
    }, (err, res, body) => {
        parseString(body, (err, result) => {
            if(result && result.response.json) {
                var messages = JSON.parse(result.response.json[0]).messages;

                if(messages) {
                    var greatestTime = 0;
                    var latestMessage = {};
                    for(key in messages) {
                        var message = messages[key];
                        if(message.id) {
                            request({
                                method: "POST",
                                uri: "https://www.google.com/voice/inbox/deleteForeverMessages/",
                                headers: {
                                    cookie
                                },
                                form: {
                                    _rnr_se,
                                    messages: message.id
                                }
                            }, (err, res, body) => {
                                deleting = false;
                            });
                        } else {
                            continue;
                        }

                        if(Number(message.startTime) > greatestTime && !message.isTrasn) {
                            greatestTime = message.startTime;
                            latestMessage = message;
                        } else {
                            continue;
                        }
                    }
                    if(latestMessage.labels && latestMessage.labels.indexOf("unread") > -1) {
                        deleting = true;
                        request({
                            method: "POST",
                            uri: "https://www.google.com/voice/inbox/deleteForeverMessages/",
                            headers: {
                                cookie
                            },
                            form: {
                                _rnr_se,
                                messages: latestMessage.id
                            }
                        }, (err, res, body) => {
                            deleting = false;
                        });
                        if(latestMessage !== previousLatest) {
                            events.emit("sms", latestMessage.phoneNumber, latestMessage.messageText, latestMessage.displayStartDateTime);
                        }
                    }
                }
            }
        });
        requesting = false;
    });
}

prot.login = async function() {
    await driver.get("https://accounts.google.com/ServiceLogin?service=grandcentral&continue=https://www.google.com/voice/b/0/redirection/voice&followup=https://www.google.com/voice/b/0/redirection/voice#inbox");
    await driver.wait(until.titleIs("Google Voice"));
    await driver.findElement(By.name("Email")).sendKeys(this._email, Key.RETURN);

    var passfield = await locationPromiseByName("Passwd"); // Find the password field and wait until it is visible
    await visibilityPromise(passfield);
    await passfield.sendKeys(this._password, Key.RETURN);

    await driver.sleep(10000);

    _rnr_se = await driver.executeScript("return document.getElementsByTagName(\"input\")._rnr_se.value");
    
    var NID = await driver.manage().getCookie("NID");
    var HSID = await driver.manage().getCookie("HSID");
    var SSID = await driver.manage().getCookie("SSID");

    cookie = (await driver.executeScript("return document.cookie")) + "; NID=" + NID.value + "; HSID=" + HSID.value + "; SSID=" + SSID.value + ";";

    setInterval(getNew, 500);
    this.events.emit("init");
}

prot.sendSMS = function(number, msg) {
    request({
        method: "POST",
        uri: "https://www.google.com/voice/sms/send/",
        headers: {
            cookie
        },
        form: {
            phoneNumber: "+1" + number,
            text: msg,
            _rnr_se
        }
    }, (err, res, body) => {
    });
}

function locationPromiseByName(name) {
    return driver.wait(until.elementLocated(By.name(name)));
}

function visibilityPromise(el) {
    return driver.wait(until.elementIsVisible(el));
}

module.exports = Client;