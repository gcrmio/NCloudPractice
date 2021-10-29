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

const client = new pg.Client(dbconfig);
client.connect(err =>{
  if(err){
    console.log('Failed to connect db ' + err);
  } else {
    console.log('Connect to db done!');
  }
})