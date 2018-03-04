# seneca-mqtt-transport

[![NPM][npm-image]][npm-url]

Seneca MQTT transport.

[Seneca](http://senecajs.org/) is a microservices framework and [EMQ](http://emqtt.io/) is 
an open-source, high-performance, lightweight MQTT cloud messaging system. This library provides
a publish-subscribe message distribution model.

## Installation

```bash
npm install seneca-mqtt-transport
```

## Usage

[EMQ server](http://emqtt.io/downloads) **should** be running.

```javascript
// server.js

require('seneca')()
  .use('mqtt-transport', {  // Send optional parameters to the library
    mqtt{
      url: 'mqtt://server:port',    //optional. Default mqtt://127.0.0.1:1883
      prefix: 'miservice',          //optional. Default none
      emq: true                     //optional. Support for $queue topic for load balancing. Only EMQ server
    }    
  })
  .add({role: 'foo', cmd: 'bar'}, function(msg, done) { return done(null, msg); })
  .listen({
    type:'mqtt', 
    mqtt: { // You cand send parameters in use method or listen method
      url: 'mqtt://server:port',    //optional. Default mqtt://127.0.0.1:1883
      prefix: 'miservice',          //optional. Default none
      emq: true                     //optional. Support for $queue topic for load balancing. Only EMQ server
    }
  });
```

```javascript
// client.js

require('seneca')()
  .use('mqtt-transport'{  // Send optional parameters to the library
    mqtt{
      url: 'mqtt://server:port',    //optional. Default mqtt://127.0.0.1:1883
      prefix: 'miservice',          //optional. Default none
      emq: true                     //optional. Support for $queue topic for load balancing. Only EMQ server
    }    
  })
  .client({
    type:'mqtt', 
    mqtt: { // You cand send parameters in use method or listen method
      url: 'mqtt://server:port',    //optional. Default mqtt://127.0.0.1:1883
      prefix: 'miservice',          //optional. Default none
      emq: true                     //optional. Support for $queue topic for load balancing. Only EMQ server
    }
  })
  .act({role: 'foo', cmd: 'bar', arg1: 1, arg2: 2}, console.log);
```

```bash
node server.js
node client.js
```

## License

Licensed under The MIT License (MIT)  
For the full copyright and license information, please view the LICENSE.txt file.

[npm-url]: http://npmjs.org/package/seneca-mqtt-transport
[npm-image]: https://badge.fury.io/js/seneca-mqtt-transport.svg
