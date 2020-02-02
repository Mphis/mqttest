//MQTT and temporary database connection
var http = require('http'),
    httpServ = http.createServer(),
    mosca = require('mosca'),
    mqtt    = require('mqtt'),
    internetAvailable = require("internet-available"),
    fs = require('fs'),
    mqttServ = new mosca.Server({});

// stuff for firebase upload 
const express = require('express');
const app = express();
const googleStorage = require('@google-cloud/storage');
const Multer = require('multer');
const mime = require('mime-types');

const keyFilename="./file.json"; //replace this with api key file
const projectId = "noble-operation-214809" //replace with your project id
const bucketName = `gs://noble-operation-214809.appspot.com`;
const {Storage} = require('@google-cloud/storage');
  
const storage = new Storage({
  projectId: projectId,
  keyFilename :keyFilename
});

var m ;
var data = []; 
var result ,result1; 
var image2base64 ; 
var ff;
var a_data;
var l_data;
var s_data;
const delay = require('delay');
const bucket = storage.bucket(bucketName);

//firebase upload stuff ends 




//--------------------------------

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
        client_mqtt.subscribe('light',0);
        client_mqtt.subscribe('audio',0);
        client_mqtt.subscribe('sensor',0);
})

client_mqtt.on('message', function (topic, message) {
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
 
 //-----------------------------------------------------------------------------------
    
    console.log('Storing Message');
    internetAvailable().then(function(){
        console.log("Internet available");
        client.query("DELETE FROM topic1 RETURNING *;", (err, res) => {
            if (err) throw err;
            l_data = '';
            for (let row of res.rows) {
                console.log(row.data_a+'hii');
                l_data = l_data + row.data_a;
            }
            (async () => {

                recieve(l_data,data);
                console.log(data);
                console.log("recieveed");
                await delay(10000);
                //console.log("waito  fe done");
                // Executed 100 milliseconds later
                upload(l_data);

            })();
            
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

function recieve(l_data, data) {

  data.push(["light", l_data]);
  console.log(data);
}


function upload(data) {

    // require('./lzma.js');
    var my_lzma = require('lzma');
        var compress_me = data;
         var compression_mode = process.argv[3] || 9;
    
    /// First, let's compress it.
    my_lzma.compress(compress_me, 8 , function (result) {
        ///NOTE: LZMA-JS returns a regular JavaScript array. You can turn it into a buffer like so.
        console.log("Compressed: ", result);
        result1 = Buffer.from(result,"utf8")
      console.log("Decompressing: " + (percent * 100) + "%");
        // });
    
    fs.open( "f2.txt" , "w" , (err,fd) => {
      if(err)
      {
        console.log("error"+err);
      }
      else
      {
    
        let bytes = fs.writeSync(fd,result1,0,result1.byteLength,0);
        console.log("file opened ");
    console.log(bytes);
    
        fs.close(fd,(err) => {
          console.log("closed");
        })
      }
    })
    
    const filePath = "f2.txt";
    console.log("pathhhhh"+filePath)
    const uploadTo = 'undefined/'+Date.now();
    console.log(uploadTo);
    const fileMime = mime.lookup(filePath);
    
    
    bucket.upload(filePath,{
        destination:uploadTo,
        public:true,
        metadata: {contentType: fileMime,cacheControl: "public, max-age=300"}
    }, function(err, file) {
        if(err)
        {
            console.log(err);
            return;
        }
        console.log(createPublicFileURL(uploadTo));
    });
     
     
    function createPublicFileURL(storageName) {
        return `http://storage.googleapis.com/${bucketName}/${encodeURIComponent(storageName)}`;
     
    }
    
    
    }, function (percent) {
        /// Compressing progress code goes here.
        console.log("Compressing: " + (percent * 100) + "%");
    });
    
        
    }

