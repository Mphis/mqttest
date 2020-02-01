var http = require('http'),
    httpServ = http.createServer(),
    mosca = require('mosca'),
    mqttServ = new mosca.Server({});

mqttServ.attachHttpServer(httpServ);

httpServ.listen(process.env.PORT || 8080);


const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

//client.connect();
client.on('connect', () => console.log('connected to db'));
