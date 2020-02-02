//MQTT and temporary database connection
var http = require('http'),
    httpServ = http.createServer(),
    mosca = require('mosca'),
    mqtt    = require('mqtt'),
    internetAvailable = require("internet-available"),
    mqttServ = new mosca.Server({});

mqttServ.attachHttpServer(httpServ);

httpServ.listen(process.env.PORT || 8080);


const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
console.log('connecting');
client.connect();
console.log('connected');


//From MQTT to temporary database
client.query('SELECT data_a FROM topic1;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
});

var client_mqtt  = mqtt.connect('ws://mqtt-broker-hackit.herokuapp.com');

client_mqtt.on('connect', function () {
    client_mqtt.subscribe('light')
})
client_mqtt.on('message', function (topic, message) {
    context = message.toString();
    client.query("INSERT INTO topic1 (data_a) VALUES ('"+ context +"');", (err, res) => {
      if (err) throw err;
    });
console.log(context)
})

//5 mins data collection, compression and send to database
setInterval(function() {
    client.query('SELECT data_a FROM topic1;', (err, res) => {
        if (err) throw err;
        for (let row of res.rows) {
          console.log(JSON.stringify(row));
        }
      });   
    console.log('Message Stored');
    internetAvailable().then(function(){
        console.log("Internet available");
        client.query("DELETE FROM topic1 RETURNING *;", (err, res) => {
            if (err) throw err;
            for (let row of res.rows) {
                console.log(row.data_a+'hii');
            }
          });
    }).catch(function(){
        console.log("No internet");
    });
}, 30000);

