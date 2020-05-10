//this is for a gate, based on the garage door opener, and written for a centurion D5 D10 gate and a sonoff SV 

// to test the plugin run
// homebridge -D -P /home/pi/testgarage/


// MQTT Garage Accessory plugin for HomeBridge
//
// Remember to add accessory to config.json. Example:
// "accessories": [
//      {
//      "accessory": "MqttGateController",
//      "name": "PUT THE NAME OF YOUR ACCESSORY HERE",
//      "url": "PUT URL OF THE BROKER HERE",
//      "username": "PUT USERNAME OF THE BROKER HERE",
//      "password": "PUT PASSWORD OF THE BROKER HERE",
//      "topics":
//              {
//              "gateStatus": status topic (open, close, opening, closing),
//              "buttonPress": button press topic
//              }
//      }
// ],
//
// When you attempt to add a device, it will ask for a "PIN code".
// The default code for all HomeBridge accessories is 031-45-154.

//gate states
//Characteristic.CurrentDoorState.OPEN = 0;
//Characteristic.CurrentDoorState.CLOSED = 1;
//Characteristic.CurrentDoorState.OPENING = 2;
//Characteristic.CurrentDoorState.CLOSING = 3;
//Characteristic.CurrentDoorState.STOPPED = 4;

'use strict';

var Service, Characteristic;
var mqtt = require("mqtt");

function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}

function MqttGateController(log, config){
    /*
     * The constructor function is called when the plugin is registered.
     * log is a function that can be used to log output to the homebridge console
     * config is an object that contains the config for this plugin that was defined the homebridge config.json
     */
    this.log = log;
    this.name = config.name;
    this.url = config.url;
    this.topicGateStatus = config.topics.gateStatus; // the target value sent to HomeKit 
    this.topicbuttonPress = config.topics.buttonPress;
    this.client_Id = 'mqttjs_electricgate';
    this.publish_options = {
        qos: 	((config.qos !== undefined) ? config.qos : 0),
        retain: ((config.retain !== undefined) ? config.retain : true)
    };
    this.options = {
        keepalive: 10,
        clientId: this.client_Id,
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        will: {
            topic: 'WillMsg',
            payload: 'Connection Closed abnormally..!',
            qos: 	((config.qos !== undefined) ? config.qos : 0),
            retain: ((config.retain !== undefined) ? config.retain : true)
        },
        username: config.username,
        password: config.password,
        rejectUnauthorized: false
    };
    //this.gateState = 1;

    // connect to MQTT broker
    this.client = mqtt.connect(this.url, this.options);
    var that = this;

    this.client.on('error', function (err) {
        that.log('Error event on MQTT ' + err);
    });

    //subscribe to the topics to get the gate status
    this.client.subscribe(this.topicGateStatus);
    

    this.client.on('message', function (topic, message) {
        that.log('get a message');
        if (topic == that.topicGateStatus) { //gate status
            that.log('Topic: ' + topic + ', message: ' + message);
                this.gateState = message;           
                that.service.getCharacteristic(Characteristic.CurrentDoorState).setValue(String(message));
        }    
    });

    if (this.gateState == undefined){
        this.gateState = 4;
    }
}

module.exports = function (homebridge) {
    /* this is the starting point for the plugin where we register the accessory */
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-mqttgate", "MqttGateController", MqttGateController);
};

MqttGateController.prototype = {
  getServices: function () {
      /*
     * The getServices function is called by Homebridge and should return an array of Services this accessory is exposing.
     * It is also where we bootstrap the plugin to tell Homebridge which function to use for which action.
     */

     /* Create a new information service. This just tells HomeKit about our accessory. */
    let informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Danie du Plessis")
      .setCharacteristic(Characteristic.Model, "Sonof SV Centurion D5 D10 Gate Opener")
      .setCharacteristic(Characteristic.SerialNumber, "123-456-789");
 
    /*
     * For each of the service characteristics we need to register setters and getter functions
     * 'get' is called when HomeKit wants to retrieve the current state of the characteristic
     * 'set' is called when HomeKit wants to update the value of the characteristic
     */
    let service = new Service.GarageDoorOpener(this.name);
    service
      .getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', this.getCurrentGateStateHandler.bind(this))
        .on('set', this.setCurrentGateStateHandler.bind(this));
        
    service
      .getCharacteristic(Characteristic.TargetDoorState)
        .on('get', this.getTargetGateStateHandler.bind(this))
        .on('set', this.setTargetGateStateHandler.bind(this));
 
    this.informationService = informationService;
    this.service = service;

    /* Return both the main service (this.service) and the informationService */
    return [informationService, service];
  }
};

MqttGateController.prototype.setTargetGateStateHandler = function(value, callback){
     /* this is called when HomeKit wants to update the value of the characteristic as defined in our getServices: function () */

    /*
     * The desired value is available in the `value` argument.
     * This is just an example so we will just assign the value to a variable which we can retrieve in our get handler
     */
    this.gateState = value;

    /* Log to the console the value whenever this function is called */
    this.log('calling setTargetGateStateHandler', value);


    this.client.publish(this.topicbuttonPress, String(1),this.publish_options);
    wait(700);
    this.client.publish(this.topicbuttonPress, String(0),this.publish_options);
    /*
     * The callback function should be called to return the value
     * The first argument in the function should be null unless and error occured
     */

     //THIS IS SO WRONG IT HURTS
     //wait(10000);
     //this.service.getCharacteristic(Characteristic.CurrentDoorState).setValue(this.gateState);
    
    callback(null);
};

MqttGateController.prototype.setCurrentGateStateHandler = function(value, callback){
    /* this is called when HomeKit wants to update the value of the characteristic as defined in our getServices: function () */

   /*
    * The desired value is available in the `value` argument.
    * This is just an example so we will just assign the value to a variable which we can retrieve in our get handler
    */
   this.gateState = value;

   /* Log to the console the value whenever this function is called */
   this.log('calling setCurrentGateStateHandler', value);

   /*
    * The callback function should be called to return the value
    * The first argument in the function should be null unless and error occured
    */
   callback(null);
};  

MqttGateController.prototype.getCurrentGateStateHandler = function (callback){
    /*
     * this is called when HomeKit wants to retrieve the current state of the characteristic as defined in our getServices: function ()
     * it's called each time you open the Home app or when you open control center
     */

     /* Log to the console the value whenever this function is called */
    this.log('calling getCurrentGateStateHandler', this.gateState);

     /*
     * The callback function should be called to return the value
     * The first argument in the function should be null unless and error occured
     * The second argument in the function should be the current value of the characteristic
     */
    callback(null, this.gateState);
};

MqttGateController.prototype.getTargetGateStateHandler = function (callback){
    /*
     * this is called when HomeKit wants to retrieve the current state of the characteristic as defined in our getServices: function ()
     * it's called each time you open the Home app or when you open control center
     */

     /* Log to the console the value whenever this function is called */
    this.log('calling getTargetGateStateHandler', this.gateState);

     /*
     * The callback function should be called to return the value
     * The first argument in the function should be null unless and error occured
     * The second argument in the function should be the current value of the characteristic
     */
    callback(null, this.gateState);
};

