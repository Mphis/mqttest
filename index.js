var http = require('http'),
    httpServ = http.createServer(),
    mosca = require('mosca'),
    mqttServ = new mosca.Server({});

mqttServ.attachHttpServer(httpServ);

httpServ.listen(process.env.PORT || 8080);

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'me',
  host: 'ec2-3-210-157-123.compute-1.amazonaws.com',
  database: 'd86bouiv0virpk',
  password: '4b1b8b8de8af9eae0dc1b66e41b53dfc69fe28320189eaa2bb30406ced2e3dab',
  port: 5432,
});

if (env === 'development') {
    connectionString.database = secrets.database;
} else {
    connectionString = {
    connectionString: process.env.DATABASE_URL,
    ssl: true
    };
};
const pool = new Pool(connectionString);
pool.on('connect', () => console.log('connected to db'));
