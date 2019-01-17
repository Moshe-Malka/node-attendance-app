const mqtt = require('mqtt');
const mongoose = require('mongoose');
const path = require('path');
const moment = require('moment');
const { Worker } = require('./../../models/models');

const host = 'iot.eclipse.org'; //'test.mosquitto.org';
const port = 1883;
const options = {
  clientId: 'AttandanceApp_v1',
  reconnectPeriod: 5000,
  connectTimeout: 30 * 1000
};
const attendanceTopic = 'attendance/rpi-attendance';
const confirmationTopic = 'attendance/rpi-confirmation';
const dateFormat = "YYYY-MM-DD k:mm:ss";
const client = mqtt.connect(`mqtt://${host}:${port}`, options);
client.setMaxListeners(100);

client.on('connect', () => {
  client.subscribe(attendanceTopic, { qos: 1 }, (err, data) => {
    if (err) {
      console.log(`[${moment().format(dateFormat)}][MQTT] Unsuccesfull in subscribing to ${defaultTopic}`);
      throw err;
    }
  });
  console.log(`[${moment().format(dateFormat)}][MQTT] Connected. host: ${host} port: ${port}`);
});

client.on('reconnect', () => {
  console.log(`[${moment().format(dateFormat)}][MQTT] Reconnecting. host: ${host} port: ${port}`);
});

client.on('close', () => {
  console.log(`[${moment().format(dateFormat)}][MQTT] Disconnected. host: ${host} port: ${port}`);
});

client.on('error', (err) => {
  console.log(`[${moment().format(dateFormat)}][MQTT] Error - Cannot connect : ${host} on port ${port}.\n${error}`);
});

client.on('message', (topic, message) => {
  handleMessages(message);
  console.log(`[${moment().format(dateFormat)}][MQTT] Received message - Topic: ${topic} , Message: ${message}`);
});

var handleMessages = (message) => {
  let msg = JSON.parse(message);
  let ts = msg.attandanceTimestamps;
  let m_rfid = msg.m_rfid;
  if (m_rfid && ts) {
    Worker.findOne({ rfid: m_rfid }, (err, worker) => {
      if (err || !worker) {
        console.log(`[${moment().format(dateFormat)}][Mongoose] Failed to find worker`);
        pub(`{ "rfid" : ${m_rfid} , "success" : "0" }`);
      } else {
        // handle duplicated timestamps
        if (ts.some(x => !worker.attandanceTimestamps.includes(x))) {
          /*
          if there is at least one new time stamp that is not already in the list of timestamps for this worker,
          then itirate over that array and insert every timestamp that is new.
          */
          ts.forEach((x) => {
            if (!worker.attandanceTimestamps.includes(x)) {
              console.log(`New timestamp => ${x}`);
              worker.attandanceTimestamps.push(x);
            }
          });
          worker.save((err, result) => {
            if (err) {
              console.log(`[${moment().format(dateFormat)}][Mongoose] Failed to save changes to the db.`);
              pub(`{ "rfid" : ${m_rfid} , "success" : "0" }`);
              throw err;
            } else {
              console.log(`[${moment().format(dateFormat)}][Mongoose] Finished Inserting new timestamp/s to db`);
              pub(`{ "rfid" : ${m_rfid} , "success" : "1" }`);
            }
          });
        } else {
          console.log(`[${moment().format(dateFormat)}][Mongoose] No new timestamps to insert.`);
          pub(`{ "rfid" : ${m_rfid} , "success" : "0" }`);
        }
      }
    });
  } else {
    pub(`{ "rfid" : ${m_rfid} , "success" : "0" }`);
    console.log(`[${moment().format(dateFormat)}][MQTT] Error - mqtt payload invalid.`);
  }
};

var pub = (message) => {
  client.publish(confirmationTopic, message, {
    qos: 1
  }, (err) => {
    if (err) throw err;
    console.log(`[${moment().format(dateFormat)}][MQTT] Sent message - topic: ${confirmationTopic} , message: ${message}`);
  });
};

exports.client = client;
