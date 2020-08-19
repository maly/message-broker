/*

MQTT-like message broker with pub-sub pattern.

var broker = require("broker.js");

Publish: broker.pub(topic, message)

Subscribe: broker.sub(pattern,callback)

Callback is function(message,topic,matchedPattern)

topic patterns: 
- /x/y/z
- /x/+/z
- /x/*


 */

//topic parser

var parse = function (topic) {
  let arr = topic.split("/");
  //normalize
  while (arr[0] === "") arr.shift();
  while (arr[arr.length - 1] === "") {
    arr.pop();
  }

  return arr;
};

var topicMatch = function (topic, pattern) {
  var pt = parse(pattern);
  var tt = parse(topic);
  var top = 0;
  for (var i = 0; i < pt.length; i++) {
    if (top > tt.length - 1) return false;
    var ps = pt[i];
    var ts = tt[top];
    if (ps === ts) {
      //equal
      top++;
      continue;
    }
    if (ps === "+") {
      top++;
      continue;
    }
    if (ps === "*") {
      return true;
    }
    return false;
  }
  return top == tt.length;
};

var topicGet = function (topic, pattern) {
  var out = [];
  var pt = parse(pattern);
  var tt = parse(topic);
  var top = 0;
  for (var i = 0; i < pt.length; i++) {
    if (top > tt.length - 1) return out;
    var ps = pt[i];
    var ts = tt[top];
    if (ps === ts) {
      //equal
      top++;
      continue;
    }
    if (ps === "+") {
      out.push(ts);
      top++;
      continue;
    }
    if (ps === "*") {
      out.push(...tt.splice(top));
      return out;
    }
    return out;
  }
  return out;
};

//broker

var subscribers = [];
var uid = 0;

var sub = function (pattern, callback) {
  uid++;
  subscribers.push({
    pattern: pattern,
    cb: callback,
    id: uid,
    active: true,
    qos: 0,
  });
  return uid;
};

var pub = function (topic, message) {
  var sends = subscribers.filter(function (q) {
    if (q.active === false) return false;
    return topicMatch(topic, q.pattern);
  });
  for (var i = 0; i < sends.length; i++) {
    var send = sends[i];
    send.cb(message, topic, topicGet(topic, send.pattern));
  }
};

module.exports = {
  pub: pub,
  sub: sub,
};