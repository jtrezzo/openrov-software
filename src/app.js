/*
 *
 * Description:
 * This script is the Node.js server for OpenROV.  It creates a server and instantiates an OpenROV
 * and sets the interval to grab frames.  The interval is set with the DELAY variable which is in
 * milliseconds.
 *
 */

var CONFIG = require('./lib/config')
  , express = require('express')
  , app = express()
  , server = app.listen(CONFIG.port)
  , io = require('socket.io').listen(server)
  , EventEmitter = require('events').EventEmitter
  , OpenROVCamera = require(CONFIG.OpenROVCamera)
  , OpenROVController = require(CONFIG.OpenROVController)
  , OpenROVArduinoFirmwareController = require('./lib/OpenROVArduinoFirmwareController')
  , logger = require('./lib/logger').create(CONFIG.debug)
  ;

app.use(express.static(__dirname + '/static/'));

process.env.NODE_ENV = true;

var globalEventLoop = new EventEmitter();
var DELAY = Math.round(1000 / CONFIG.video_frame_rate);
var camera = new OpenROVCamera({delay : DELAY});
var controller = new OpenROVController(globalEventLoop);
var arduinoUploadController = new OpenROVArduinoFirmwareController(globalEventLoop);

app.get('/config.js', function(req, res) {
  res.type('application/javascript');
  res.send('var CONFIG = ' + JSON.stringify(CONFIG));
});

// no debug messages
io.configure(function(){ io.set('log level', 1); });

var connections = 0;

// SOCKET connection ==============================
io.sockets.on('connection', function (socket) {
  connections += 1;

  socket.send('initialize');  // opens socket with client

    socket.on('motor_test', function(controls) {
        controller.sendMotorTest(controls.port, controls.starbord, controls.vertical);
    });
    socket.on('control_update', function(controls) {
        controller.sendCommand(controls.throttle, controls.yaw, controls.lift);
    });

    socket.on('tilt_update', function(value) {
        controller.sendTilt(value);
    });

    socket.on('brightness_update', function(value) {
        controller.sendLight(value);
    });

    controller.on('status',function(status){
        socket.emit('status',status);
    })

  arduinoUploadController.initializeSocket(socket);

  camera.on('started', function(){
    socket.emit('videoStarted');
    console.log("emitted 'videoStated'");
  });

  camera.capture(function(err) {
    if (err) {
      connections -= 1;
      camera.close();
      return console.error('couldn\'t initialize camera. got:', err);
      }
  });

});


// SOCKET disconnection ==============================
io.sockets.on('disconnect', function(socket){
  connections -= 1;
  if(connections === 0) rov.close();
});

camera.on('error.device', function(err) {
  console.error('camera emitted an error:', err);
});

if (process.platform === 'linux') {
  process.on('SIGTERM', function() {
    console.error('got SIGTERM, shutting down...');
    camera.close();
    process.exit(0);
  });

  process.on('SIGINT', function() {
    console.error('got SIGINT, shutting down...');
    camera.close();
    process.exit(0);
  });
}

console.log('Started listening on port: ' + CONFIG.port);
