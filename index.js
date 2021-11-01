var express = require('express');
var CryptoJS = require('crypto-js');
var request = require('request');
var pg = require('pg');
var app = express();

app.set("port", (process.env.PORT || 3000));
app.listen(app.get("port"),
function(){
    console.log("wj-nodejs heroku app is running on ["+app.get("port")+"]");
});

app.get("/", function(req, res){
    res.send("Hellooooooo");
})

// app.get('/sms/:phone', (req, res) => {
  app.get('/sms/', (req, res) => {
    console.log("==================================");
    dbSelect();
    //const paramObj = req.params;
    //send_message(paramObj.phone);
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

app.get('/dbSelect', (req, res) => {
  try {
    console.log("DBSELECT=======================================");
    dbSelect();
    res.send('DB Select Complete!');
  } catch (error) {
    console.log('There was an error!');
  }
})

app.get('/status/:messageId', (req, res) => {
    console.log("==================================");
    const paramObj = req.params;
    get_result(paramObj.phone);
    res.send("complete!");
    console.log("get send result done");
})
//0.DB쿼리조회
function dbSelect(){
  const sql = `SELECT sid, firstname, lastname, mobile, sb, msg FROM target_send`

  client.query(sql, (err, res) => {
    if(err){
      console.log(err.stack);
    } else {
      //console.log(res.rows);
      for(const row of res.rows){
        var firstname = row.firstname;
        var lastname = row.lastname;
        var mobile = row.mobile;
        var sb = row.sb;
        var msg = row.msg;
        // console.log('name= '+firstname+' '+lastname+', mobile='+mobile);
        // console.log('--sb:'+`\n`+sb);
        // console.log('--msg:'+`\n`+msg);
        // console.log('length of firstname= '+firstname.length);
        // console.log('length of lastname= '+lastname.length);
        // console.log('length of mobile= '+mobile.length);
        // console.log('length of sb= '+sb.length);
        // console.log('length of msg= '+msg.length);
        // fnArr.push(firstname);
        // lnArr.push(lastname);
        // mArr.push(mobile);
        // sbArr.push(sb);
        // msgArr.push(msg);
        try {
          send_message(mobile, sb, msg);
          console.log(sid+' has successfully sent');
        } catch (error) {
          console.log('send message error');
        }
      }
      // console.log('*************************************************************');
      // console.log(res.rows);
    }
  })
}

//1.메시지 발송
function send_message(mobile, sb, msg) {
  var user_phone_number = mobile;
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
      type: "LMS",
      countryCode: "82",
      from: fromMobile,
      subject: sb,
      content: msg,
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

//2. DB데이터추가
function dbInsert(){
  const sql = `INSERT INTO target_send(firstname, lastname, mobile) VALUES($1, $2, $3) RETURNING *`;
  const values = ['Karl', 'Jung', '01071564823'];
  client.query(sql, values, (err, res) => {
    if(err){
      console.log(err.stack);
    } else {
      console.log(res.rows[0]);
    }
  });
}

//3.메시지 발송 결과 조회
function get_result(messageId) {
  var message_id = messageId;
  var resultCode = 404;
  const date = Date.now().toString();
  const uri = process.env.SERVICE_ID;
  const secretKey = process.env.NCP_SECRET_KEY;
  const accessKey = process.env.NCP_KEY;
  const fromMobile = process.env.FROMMOBILE;
  const method = "GET";
  const space = " ";
  const newLine = "\n";
  const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages/${message_id}`;
  const url2 = `${uri}`;
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

    },
  },
    function (err, res, html) {
      if (err) console.log(err);
      else { resultCode = 200; console.log(html); }
    }
  );
  return resultCode;
}