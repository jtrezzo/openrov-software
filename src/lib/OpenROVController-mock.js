/*
 * Created for OpenROV:  www.openrov.com
 * Author:  Simon Murtha-Smith, Bran Sorem
 * Date: 06/03/12
 *
 * Description:
 * This file holds the controller logic.  It manages the connection to the Atmega328.
 * TODO: must manually enable UART.  Fix this.
 * >>$ echo 0 > /sys/kernel/debug/omap_mux/uart1_txd
 * >>$ echo 20 > /sys/kernel/debug/omap_mux/uart1_rxd
 * Note: RX not setup yet, needs to be added
 *
 * License
 * This work is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported License.
 * To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/3.0/ or send a
 * letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 */

var CONFIG = require('./config')
  , logger = require('./logger').create(CONFIG.debug)
  , StatusReader = require('./StatusReader')
  , ArduinoPhysics = require('./ArduinoPhysics')
  , EventEmitter = require('events').EventEmitter;

var OFFSET = 90;

var OpenROVController = function() {
    var controller = new EventEmitter();
    var reader = new StatusReader();
    var physics = new ArduinoPhysics();

    setInterval(sendEvent,3000);

    function sendEvent() {
        var data ="vout:1023;time:11000";
        var status = reader.parseStatus(data);
        controller.emit('status',status);
    }
    controller.sendMotorTest = function(port, starbord, vertical) {
        var command = 'go(' + port + ',' + vertical + ',' + starbord + ');';
        console.log(command);
    };
    controller.sendCommand = function(throttle, yaw, vertical) {
        var motorCommands = physics.mapMotors(throttle, yaw, vertical);
        var command = 'go(' + motorCommands.port + ',' + motorCommands.vertical + ',' + motorCommands.starbord + ');';
        console.log(command);
    };

    controller.sendTilt = function(value) {
        var servoTilt = physics.mapTiltServo(value);
        var command = 'tilt(' + servoTilt +');';
        console.log("command", command);
    };

    controller.sendLight = function(value) {
        var light = physics.mapLight(value);
        var command = 'light(' + light +');';
        console.log("command", command);
    };

  return controller;
}



module.exports = OpenROVController;
