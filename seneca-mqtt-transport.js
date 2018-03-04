/*
 * seneca-mqtt-transport
 * For the full copyright and license information, please view the LICENSE.txt file.
 */

/* jslint node: true */
'use strict';

var mqtt = require('mqtt');

module.exports = function (options) {
  options.mqtt = options.mqtt || {};

  options.mqtt.url = process.env.MQTT_URL || options.mqtt.url || 'mqtt://127.0.0.1:1883';

  var seneca = this,
    plugin = 'mqtt-transport';

  var senecaOpts = seneca.options(),
    transpUtils = seneca.export('transport/utils');


  options = seneca.util.deepextend({
    mqtt: {
      keepalive: 60,
      reconnectPeriod: 1000
    }
  }, senecaOpts.transport, options);

  seneca.add({ role: 'transport', hook: 'listen', type: 'mqtt' },   
  // Listen hook for the transport
  function (msg, done) {

    var seneca = this,
      type = msg.type,
      clientOpts = seneca.util.clean(seneca.util.deepextend({
        clientId: 'seServ_' + Math.random().toString(16).substr(2, 8),
      }, options[type], msg)),
      clientName = 'listen-' + type;

    // Fix problem with seneca default port
    delete clientOpts.port;
    var nc = mqtt.connect(clientOpts.url, clientOpts);

    // Connect event
    nc.on('connect', function (/*client*/) {
      seneca.log.info('listen', 'open', clientOpts);

      // Listen topics
      transpUtils.listen_topics(seneca, msg, clientOpts, function (topic) {
        var topicAct = topic + '_act',
          topicRes = topic + '_res';

        // Subscribe to act topic
        nc.subscribe(topicAct);

        nc.on('message', function(topic, msg){
          if(topic == topicAct){
          seneca.log.debug('listen', 'subscribe', topicAct, 'message', msg);

          // Handle request
          transpUtils.handle_request(seneca, transpUtils.parseJSON(seneca, clientName, msg), clientOpts, function (out) {
            // If there is an output then
            if (out) {
              // Publish it to response topic
              nc.publish(topicRes, transpUtils.stringifyJSON(seneca, clientName, out));
            }
          });
          }
        });
        
        seneca.log.info('listen', 'subscribe', topicAct);
      }); 

      done();
    });

    // Error event
    nc.on('error', function (err) {
      seneca.log.error('listen', 'error', err);
      throw new Error('mqtt connection error');
    });

    // Closer action
    seneca.add({ role: 'seneca', cmd: 'close' }, function (args, cb) {
      seneca.log.debug('listen', 'close', clientOpts);

      nc.end();
      this.prior(args, cb);
    });
  });


  seneca.add({ role: 'transport', hook: 'client', type: 'mqtt' }, 
  // Client hook for the transport
  function (msg, done) {

    var seneca = this,
      type = msg.type,
      clientOpts = seneca.util.clean(seneca.util.deepextend({
        clientId: 'seCli_' + Math.random().toString(16).substr(2, 8),
      }, options[type], msg)),
      clientName = 'client-' + type;

      // Fix problem with seneca default port
      delete clientOpts.port;
      var nc = mqtt.connect(clientOpts.url, clientOpts);

    // Connect event
    nc.on('connect', function (/*client*/) {
      seneca.log.info('client', 'open', clientOpts);

      // Send is called for per topic
      function send(spec, topic, sendDone) {
        var topicAct = topic + '_act',
          topicRes = topic + '_res';

        // Subscribe to response topic
        nc.subscribe(topicRes);

        nc.on('message', function (topic, msg) {
          if (topic == topicRes){
            seneca.log.debug('client', 'subscribe', topicRes, 'message', msg);

            var data = transpUtils.parseJSON(seneca, clientName, msg) || {};
            // Handle response
            transpUtils.handle_response(seneca, data, clientOpts);
          }          
        });
        seneca.log.info('client', 'subscribe', topicRes);

        // Send message over the transport
        sendDone(null, function (msg, cb, meta) {
          seneca.log.debug('client', 'publish', topicAct, 'message', msg);

          // Publish act
          nc.publish(topicAct, transpUtils.stringifyJSON(seneca, clientName, transpUtils.prepare_request(seneca, msg, cb, meta)));
        });

        // Closer action
        seneca.add({ role: 'seneca', cmd: 'close' }, function (args, cb) {
          seneca.log.debug('client', 'close', clientOpts, 'topic', topic);

          nc.end();
          this.prior(args, cb);
        });
      }

      // Use transport utils to make client
      transpUtils.make_client(send, clientOpts, done);
    });

    // Error event
    nc.on('error', function (err) {
      seneca.log.error('client', 'error', err);
      throw new Error('mqtt connection error');
    });


  });




  

  // Return
  return {
    name: plugin
  };
};