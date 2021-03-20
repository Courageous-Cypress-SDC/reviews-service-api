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
let characteristics = new Set(['Fit', 'Length', 'Comfort', 'Quality', 'Size', 'Width']);

loadCharacteristics();

function loadCharacteristics() {
  const stream = fs.createReadStream('characteristics.csv', 'UTF8');
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  rl.on('line', (line) => {
    if (totalLines === 0) {
      // skip header
      totalLines++;
      return;
    }
    counter++;
    if (counter >= 125000) {
      rl.pause();
    }
    let data = line.split(',');
    if (data.length !== 3) {
      weirdRows.push(totalLines);
      totalLines++;
      return;
    }
    let id = parseInt(data[0]);
    if (isNaN(id)) {
      totalLines++;
      return;
    }
    let productId = parseInt(data[1]);
    if (isNaN(productId)) {
      totalLines++;
      return;
    }
    let name = data[2].split('"')[1];
    if (!characteristics.has(name)) {
      totalLines++;
      return;
    }
    rows.push([id, productId, name]);
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
      let query = 'INSERT INTO characteristics (id, product_id, name) VALUES ?';
      connection.query(query, [rows], (error, response) => {
        if (error) {
          console.log(error);
        } else {
          console.log(response);
        }
        rows = [];
        counter = 0;
        rl.resume();
      });
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