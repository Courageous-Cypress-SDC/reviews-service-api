const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql');
const config = require('../config.js');

const connection = mysql.createConnection({
  host: 'localhost',
  user: config.SQLUSER,
  password: config.SQLPASSWORD,
  database: config.SQLDATABASE
});

let rows = [];
let weirdRows = [];

let totalLines = 0;
let counter = 0;

loadCharReviews();

function loadCharReviews() {
  const stream = fs.createReadStream('characteristic_reviews.csv', 'UTF8');
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  rl.on('line', (line) => {
    counter++;
    if (counter >= 1000000) {
      rl.pause();
    }
    let data = line.split(',');
    if (data.length !== 4) {
      weirdRows.push(totalLines);
      totalLines++;
      return;
    }
    let id = data[0];
    let charId = data[1];
    let reviewId = data[2];
    let value = parseInt(data[3]);
    if (isNaN(value)) {
      console.log('invalid value');
      totalLines++;
      return;
    } else if (value <= 0) {
      value = 1;
    } else if (value > 5) {
      value = 5;
    }
    if (totalLines != 0) {
      rows.push([id, charId, reviewId, value]);
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
        'INSERT INTO characteristics_reviews (id, characteristic_id, review_id, value) VALUES ?';
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
    .on('close', () => {
      console.log('read entire file');
      console.log(totalLines);
      console.log(rows.length);
      console.log('weird rows: ', JSON.stringify(weirdRows));
      connection.end();
    });
}
