# homebridge-mqttgate
An homebridge plugin that create an HomeKit Gate accessory mapped on MQTT topics, this plugin is based on the garagedoor plugin, so the icon in homekit will be the garage door

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-mqttgate) and should be installed "globally" by typing:

    npm install -g homebridge-mqttgate
    
# Release notes
Version 1.0.0
+ Initial public draft

# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:
+ "accessory": "MqttGateController",
+ "name": "PUT THE NAME OF YOUR ACCESSORY HERE",
+ "url": "PUT URL OF THE BROKER HERE",
+ "username": "PUT USERNAME OF THE BROKER HERE",
+ "password": "PUT PASSWORD OF THE BROKER HERE",
+ "topics":
	{
        "gateStatus": 	"status topic (open, close, opening, closing)",
        "buttonPress": 	"buuton press topic"
    }

