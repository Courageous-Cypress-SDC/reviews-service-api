const fs = require('fs');
const es = require('event-stream');
const mysql = require('mysql');

let stream = fs.createReadStream('product.csv');
let csvData = [];

let totalLines = 0;
let rows = [];
let weirdRows = [];
// LOADS PRODUCTS

stream
  .pipe(es.split())
  .pipe(
    es.mapSync(function(line) {
        let data = line.split(',');
        if (data.length !== 6) {
          // i don't need to worry about these, as i'm only using id
          weirdRows.push(totalLines);
        }
        let id = data[0];
        let name = data[1].split('"')[1];
        if (totalLines != 0) {
          rows.push([id, name]);
        }
        totalLines++;
      })
      .on('error', (error) => {
        console.error(error);
      })
      .on('end', () => {
        console.log('read entire file');
        console.log(totalLines);
        console.log(rows.length);
        console.log('weird rows: ', JSON.stringify(weirdRows));
        const connection = mysql.createConnection({
          host: 'localhost',
          user: 'root',
          password: '123456',
          database: 'testCSVLoadOne'
        });

        // open the connection
        connection.connect(error => {
          if (error) {
            console.error(error);
          } else {
            let query =
              'INSERT INTO products (id, name) VALUES ?';
            connection.query(query, [rows], (error, response) => {
              console.log(error || response);
              connection.end();
            });
          }
        });
      })
  );