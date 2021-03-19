const fs = require('fs');
const es = require('event-stream');
const mysql = require('mysql');

let stream = fs.createReadStream('characteristics.csv');
let csvData = [];

let totalLines = 0;
let rows = [];
let weirdRows = [];
let characteristics = new Set(['Fit', 'Length', 'Comfort', 'Quality', 'Size', 'Width']);

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'testCSVLoadOne'
});

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
        loadCharacteristics();
      }
    });
  }
});

function loadCharacteristics() {
  stream
    .pipe(es.split())
    .pipe(
      es.mapSync(function(line) {
          let data = line.split(',');
          if (data.length !== 3) {
            // i don't need to worry about these, as i'm only using id
            weirdRows.push(totalLines);
          }
          let id = data[0];
          let productId = data[1];
          let name = data[2].split('"')[1];
          if (totalLines != 0 && characteristics.has(name) && productIds.has(parseInt(productId))) {
            rows.push([id, productId, name]);
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
          console.log(JSON.stringify(rows[0]));
          console.log('weird rows: ', JSON.stringify(weirdRows));

          // open the connection
          let rows1 = rows.slice(0, rows.length/2);
          let rows2 = rows.slice(rows.length/2);
          let query =
            `INSERT INTO characteristics (id, product_id, name) VALUES ?`;
          connection.query(query, [rows1], (error, response) => {
            if (error) {
              console.log(error);
            } else if (response) {
              console.log(response);
              connection.query(query, [rows2], (err, res) => {
                if (err) {
                  console.log(err);
                } else if (res) {
                  console.log(res);
                  connection.end();
                }
              });
            }
          });
        })
    );
}