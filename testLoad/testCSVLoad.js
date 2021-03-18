const fs = require('fs');
const mysql = require('mysql');
const fastcsv = require('fast-csv');

let stream = fs.createReadStream('product.csv');
let csvData = [];
let csvStream = fastcsv
  .parse()
  .validate((row, cb) => typeof row[0] === 'number' && typeof row[1] === 'string')
  .on('error', function(error, ...arguments) {
    console.log(arguments);
    console.error(error);
  })
  .on('data', function(data) {
    csvData.push([data[0], data[1]]);
  })
  .on('data-invalid', function(row, rowNumber, reason) {
    if (rowNumber > 1) {
      console.log(`invalid rownumber ${rowNumber}, row=${JSON.stringify(row)}, reason=${reason}`)
      csvData.push([row[0], row[1]]);
    } else if (rowNumber === 0 || rowNumber === 1) {
      console.log(`invalid rownumber ${rowNumber}, row=${JSON.stringify(row)}, reason=${reason}`);
    }
  })
  .on('end', function() {
    // remove the first line: header
    csvData.shift();

    // create a new connection to the database
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
        connection.query(query, [csvData], (error, response) => {
          console.log(error || response);
        });
      }
    });
  });

stream.pipe(csvStream);