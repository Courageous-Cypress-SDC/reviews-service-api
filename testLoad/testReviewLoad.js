const fs = require('fs');
const mysql = require('mysql');
const readline = require('readline');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'testCSVLoadOne'
});

let userRows = [];
let rows = [];
let weirdRows = [];
let totalLines = 0;
let counter = 0;
let productIds = new Set();
connection.connect((error) => {
  if (error) {
    console.error(error);
  } else {
    let query = 'select id from products';
    connection.query(query, (err, response) => {
      if (err) {
        console.log(err);
      } else {
        for (let i = 0; i < response.length; i++) {
          productIds.add(response[i].id);
        }
        loadReviews();
      }
    });
  }
});

function loadReviews() {
  const stream = fs.createReadStream('reviews.csv', 'UTF8');
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  rl.on('line', (line) => {
    counter++;
    if (counter >= 125000) {
      rl.pause();
    }
    let data = line.split(',');
    if (data.length !== 12) {
      //id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness
      weirdRows.push(totalLines);
    }
    let id = data[0];
    let productId = data[1];
    if (!productIds.has(parseInt(productId))) {
      console.log('no product id found');
      console.log('id', productId);
      totalLines++;
      return;
    }
    let rating = parseInt(data[2]);
    let parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating <= 0 || parsedRating > 5) {
      console.log('invalid rating');
      totalLines++;
      return;
    }
    let date = new Date(data[3]);
    let summary = data[4].split('"')[1];
    if (summary.length > 60) {
      // console.log('summary too long');
      summary = summary.slice(0, 60);
    }
    let body = data[5].split('"')[1];
    if (body.length < 50) {
      //console.log('body too short');
      totalLines++;
      return;
    } else if (body.length > 1000) {
      console.log('body too long');
      body = body.slice(0, 1000);
    }
    let recommend = data[6];
    if (recommend === 'true') {
      recommend = 1;
    } else if (recommend === 'false') {
      recommend = 0;
    }
    let reported = data[7];
    if (reported === 'true') {
      reported = 1;
    } else if (reported === 'false') {
      reported = 0;
    }
    let reviewer_name = data[8].split('"')[1];
    if (reviewer_name.length > 60) {
      console.log('reviewer name too long');
      reviewer_name = reviewer_name.slice(60);
    }
    let reviewer_email = data[9].split('"')[1];
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (reviewer_email.length > 60) {
      console.log('reviewer email too long');
      totalLines++;
      return;
    } else if (!emailRegex.test(reviewer_email)) {
      console.log('invalid email format');
      totalLines++;
      return;
    }
    let response = data[10];
    if (response && response.length > 1000) {
      console.log('response is too long');
      response = response.slice(1000);
    }
    let helpfulness = data[11];
    let parsedHelpful = parseInt(helpfulness);
    if (isNaN(parsedHelpful)) {
      console.log('invalid helpfulness');
      totalLines++;
      return;
    }
    if (totalLines != 0) {
      rows.push([id, productId, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness]);
    }
    totalLines++;
  })
    .on('error', (error) => {
      console.error(error);
      connection.end();
    })
    .on('pause', () => {
      console.log('paused');
      console.log(totalLines);
      console.log(rows.length);
      console.log('weird rows: ', JSON.stringify(weirdRows));
      let query =
        'INSERT INTO reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpful) VALUES ?';
      connection.query(query, [rows], (error, response) => {
        if (error) {
          console.log(error);
        } else {
          console.log(response);
        }
        rows = [];
        counter = 0;
        rl.resume();
      })
    })
    .on('resume', () => {
      console.log('resumed');
    })
    .on('close', () => {
      console.log('read entire file');
      console.log(totalLines);
      console.log(rows.length);
      console.log('weird rows: ', JSON.stringify(weirdRows));
      connection.end();
    });
}
