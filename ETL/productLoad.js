const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql');
const config = require('../config.js');

let stream = fs.createReadStream('product.csv');
let csvData = [];

let totalLines = 0;
let counter = 0;
let rows = [];
let weirdRows = [];
// LOADS PRODUCTS

const connection = mysql.createConnection({
  host: 'localhost',
  user: config.SQLUSER,
  password: config.SQLPASSWORD,
  database: config.SQLDATABASE
});

loadProducts();

function loadProducts() {
  const stream = fs.createReadStream('product.csv', 'UTF8');
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  rl.on('line', (line) => {
    if (totalLines === 0) {
      // headers -> validating could throw errors if using regex
      totalLines++;
      return;
    }
    counter++;
    if (counter >= 500000) {
      // pause after 50k lines read, then insert into sql database
      rl.pause();
    }
    let data = line.split(',');
    if (data.length !== 6) {
      // don't need to worry about these weird rows, we only need the id
      weirdRows.push(totalLines);
    }
    let id = parseInt(data[0]);
    if (isNaN(id)) {
      totalLines++;
      return;
    }
    rows.push([id]);
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
    let query = 'INSERT INTO products (id) VALUES ?';
    connection.query(query, [rows], (error, response) => {
      if (error) {
        console.error(error);
      } else {
        console.log(response);
      }
      rows = [];
      counter = 0;
      rl.resume();
    })
  })
  .on('close', () => {
    console.log('finished reading file');
    // don't need to make another query to insert remaining, pause already does that
    connection.end();
  })
}
