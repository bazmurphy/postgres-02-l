const express = require("express");
const app = express();

app.use(express.static("public"));

// We first import the Pool class from the pg library, which is used to connect to a database
const { Pool } = require("pg");

// We create a new connection (db) where we specify the credentials to connect to the cyf_hotel database
const db = new Pool({
  user: "baz",
  host: "localhost",
  database: "cyf_hotels",
  password: "password",
  port: 5432,
});

// We then create a new /customers endpoint where we use the method query() to send a SQL query to load all the customers from the table customers and return the results with result.rows. The query method returns a Promise: so we can access the returned rows using a .then block. You can write any valid SQL query that you learned in the query() method!
app.get("/customers", (req, res) => {
  db.query("SELECT id, name, city, phone FROM customers")
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/customers/:id", (req, res) => {
  db.query(`SELECT * FROM customers WHERE id=${req.params.id}`)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/reservations", (req, res) => {
  db.query("SELECT * FROM reservations")
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/reservations/:id", (req, res) => {
  db.query(`SELECT * FROM reservations WHERE id=${req.params.id}`)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/invoices", (req, res) => {
  db.query("SELECT * FROM invoices")
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/invoices/:id", (req, res) => {
  db.query(`SELECT * FROM invoices WHERE id=${req.params.id}`)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/rooms", (req, res) => {
  db.query("SELECT * FROM rooms")
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/rooms/:number", (req, res) => {
  db.query(`SELECT * FROM rooms WHERE room_no=${req.params.number}`)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/room_types", (req, res) => {
  db.query("SELECT * FROM room_types")
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "./public/index.html");
});

app.listen(3000, () => {
  console.log("The server is running on port 3000");
});
