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

client.on('connect', function () {
        client.subscribe('light',0);
        client.subscribe('audio',0);
        client.subscribe('sensor',0);
})

client.on('message', function (topic, message) {
context = message.toString();

if (topic == ('light')) {
    context = message.toString();
    client.query("INSERT INTO topic1 (data_a) VALUES ('"+ context +"');", (err, res) => {
      if (err) throw err;
    });
    console.log(context)
} 
else if (topic == ('audio')) {
    context = message.toString();
    client.query("INSERT INTO topic2 (data_b) VALUES ('"+ context +"');", (err, res) => {
      if (err) throw err;
    });
    console.log(context)  
}
else if (topic == ('sensor')) {
    context = message.toString();
    client.query("INSERT INTO topic3 (data_c) VALUES ('"+ context +"');", (err, res) => {
      if (err) throw err;
    });
    console.log(context)  }
})


//5 mins data collection, compression and send to database
setInterval(function() {
    
    
    client.query('SELECT data_a FROM topic1;', (err, res) => {
        if (err) throw err;
        for (let row of res.rows) {
          console.log(JSON.stringify(row));
        }
      });   
    client.query('SELECT data_b FROM topic2;', (err, res) => {
        if (err) throw err;
        for (let row of res.rows) {
          console.log(JSON.stringify(row));
        }
      }); 
    client.query('SELECT data_c FROM topic3;', (err, res) => {
        if (err) throw err;
        for (let row of res.rows) {
          console.log(JSON.stringify(row));
        }
      }); 
    
    
    console.log('Storing Message');
    internetAvailable().then(function(){
        console.log("Internet available");
        client.query("DELETE FROM topic1 RETURNING *;", (err, res) => {
            if (err) throw err;
            for (let row of res.rows) {
                console.log(row.data_a+'hii');
            }
          });
        client.query("DELETE FROM topic2 RETURNING *;", (err, res) => {
            if (err) throw err;
            for (let row of res.rows) {
                console.log(row.data_a+'hii');
            }
          });
        client.query("DELETE FROM topic3 RETURNING *;", (err, res) => {
            if (err) throw err;
            for (let row of res.rows) {
                console.log(row.data_a+'hii');
            }
          });
    }).catch(function(){
       console.log("No internet");
  });
}, 30000);

