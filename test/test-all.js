/* jslint node: true */
/* global describe: false, it: false, beforeEach: false, afterEach: false */
'use strict';

var lib = require('../'),
  seneca = require('seneca'),
  mqtt = require('mqtt'),
  expect = require('chai').expect;

var mqtt_options = {
  mqtt: {
    emq: true,
    prefix: 'ms'
  }
};

// Tests

describe('lib', function () {

  var server,
    client,
    nc;

  beforeEach(function () {
    server = seneca({ log: 'silent' });
    client = seneca({ log: 'silent' });
    nc = mqtt.connect('mqtt://localhost:1883');
  });

  afterEach(function () {
    client.close();
    server.close();
    nc.end();

    client = null;
    server = null;
    nc = null;
  });

  it('should listen messages', function (done) {

    var pattern = { role: 'foo', cmd: 'bar' },
      message = { role: 'foo', cmd: 'bar', argNum: 1, argStr: '2', argBool: true, argObj: {}, argAry: [] };

    nc.subscribe('ms/seneca_any_act');
    nc.on('message', function (topic, msg) {
      if (topic === 'ms/seneca_any_act') {
        expect(JSON.parse(msg).act).to.deep.equal(message);
        done();
      }

    });

    server
      .use(lib, mqtt_options)
      .add(pattern, function (msg, done) { return done(null, msg); })
      .listen({ type: 'mqtt' });

    client
      .use(lib, mqtt_options)
      .client({ type: 'mqtt' })
      .act(message);
  });

  it('should send messages', function (done) {

    var pattern = { role: 'foo', cmd: 'bar' },
      message = { role: 'foo', cmd: 'bar', argNum: 1, argStr: '2', argBool: true, argObj: {}, argAry: [] };

    nc.subscribe('ms/seneca_any_res');
    nc.on('message', function (topic, msg) {
      if (topic === 'ms/seneca_any_res') {
        var res = JSON.parse(msg).res;
        expect(res).to.be.a('object');
        expect(res.role).to.equal('foo');
        expect(res.cmd).to.equal('bar');
        expect(res.argNum).to.equal(1);
        expect(res.argStr).to.equal('2');
        expect(res.argBool).to.equal(true);
        expect(res.argObj).to.be.a('object');
        expect(res.argAry).to.be.a('array');
        done();
      }

    });

    server
      .use(lib, mqtt_options)
      .add(pattern, function (msg, done) { return done(null, msg); })
      .listen({ type: 'mqtt' });

    client
      .use(lib, mqtt_options)
      .client({ type: 'mqtt' })
      .act(message);
  });

});