var express = require('express');
var CryptoJS = require('crypto-js');
var request = require('request');
var pg = require('pg');

function send_message(phone) {
    var user_phone_number = phone;
    var resultCode = 404;
    const date = Date.now().toString();
    const uri = process.env.SERVICE_ID;
    const secretKey = process.env.NCP_SECRET_KEY;
    const accessKey = process.env.NCP_KEY;
    const fromMobile = process.env.FROMMOBILE;
    const method = "POST";
    const space = " ";
    const newLine = "\n";
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
    const url2 = `/sms/v2/services/${uri}/messages`;
    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
    hmac.update(method);
    hmac.update(space);
    hmac.update(url2);
    hmac.update(newLine);
    hmac.update(date);
    hmac.update(newLine);
    hmac.update(accessKey);
    const hash = hmac.finalize();
    const signature = hash.toString(CryptoJS.enc.Base64);
    request({
      method: method,
      json: true,
      uri: url,
      headers: {
        "Contenc-type": "application/json; charset=utf-8",
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-timestamp": date,
        "x-ncp-apigw-signature-v2": signature,
      },
      body: {
        type: "SMS",
        countryCode: "82",
        from: fromMobile,
        content: "wj-nodejs test",
        messages: [
          { to: `${user_phone_number}`, },],
      },
    },
      function (err, res, html) {
        if (err) console.log(err);
        else { resultCode = 200; console.log(html); }
      }
    );
    return resultCode;
  }


var app = express();


app.set("port", (process.env.PORT || 3000));
app.listen(app.get("port"),
function(){
    console.log("wj-nodejs heroku app is running on ["+app.get("port")+"]");
});

app.get("/", function(req, res){
    res.send("Hellooooooo");
})

app.get('/sms/:phone', (req, res) => {
    console.log("==================================");
    const paramObj = req.params;
    send_message(paramObj.phone);
    res.send("complete!");
    console.log("send message done");
})

//PG Setup
const dbconfig = {
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.port,
  ssl: {
    rejectUnauthorized: false
  }
}
console.log('PG Connect ==============================');
const client = new pg.Client(dbconfig);
client.connect(err =>{
  if(err){
    console.log('Failed to connect db ' + err);
  } else {
    console.log('Connect to db done!');
  }
})

app.get('/dbInsert', (req, res) => {
  try {
    console.log("DBINSERT=======================================");
    dbInsert();
    res.send('DB Insert complete!');
  } catch (error) {
    console.log('There was an error!');
  }
})

function dbInsert(){
  const sql = `INSERT INTO target_send(firstname, lastname, mobile) VALUES($1, $2, $3) RETURNING *`;
  const values = ['Wonny', 'Choi', '01031248442'];
  client.query(sql, values, (err, res) => {
    if(err){
      console.log(err.stack);
    } else {
      console.log(res.rows[0]);
    }
  });
}

app.get('/dbSelect', (req, res) => {
  try {
    console.log("DBSELECT=======================================");
    dbSelect();
    res.send('DB Select Complete!');
  } catch (error) {
    console.log('There was an error!');
  }
})

function dbSelect(){
  const sql = `SELECT sid, firstname, lastname, mobile, lenth(sid) AS length_sid, length(firstname) AS length_firstname, length(lastname) AS length_lastname, length(mobile) AS length_mobile FROM target_send`
  client.query(sql, (err, res) => {
    if(err){
      console.log(err.stack);
    } else {
      console.log(res.rows);
    }
  })
}