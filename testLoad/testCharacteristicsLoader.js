const fs = require('fs');
const es = require('event-stream');
const mysql = require('mysql');

let stream = fs.createReadStream('characteristics.csv');
let csvData = [];

let totalLines = 0;
let rows = [];
let weirdRows = [];

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
        if (totalLines != 0) {
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
            for (let i = 0; i < rows.length; i++) {
              let query =
                `INSERT INTO characteristics (id, product_id, name) VALUES ${rows[i][0], rows[i][1], rows[i][2]}`;
              connection.query(query, (error, response) => {
                if (error) {
                  console.log(i);
                  console.log(error);
                } else if (response) {
                  console.log(response);
                }
              });
            }
          }
        });
      })
  );