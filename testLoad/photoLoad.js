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

loadPhotos();

function loadPhotos() {
  const stream = fs.createReadStream('reviews_photos.csv', 'UTF8');
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  rl.on('line', (line) => {
    if (totalLines === 0) {
      totalLines++;
      return;
    }
    counter++;
    if (counter >= 50000) {
      rl.pause();
    }
    let data = line.split(',');
    if (data.length !== 3) {
      //id, review_id, url
      weirdRows.push(totalLines);
      totalLines++;
      return;
    }
    let id = data[0];
    let reviewId = data[1];
    let rowUrl = data[2].split('"')[1];
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    let urlMatches = rowUrl.match(urlRegex);
    if(urlMatches === 0) {
      console.log('invalid url');
      totalLines++;
      return;
    } else {
      rowUrl = urlMatches[0];
    }
    if (totalLines !== 0) {
      rows.push([id, reviewId, rowUrl]);
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
        'INSERT INTO photos (id, review_id, url) VALUES ?';
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
