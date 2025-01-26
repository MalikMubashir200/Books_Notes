const express = require('express');
const axios = require('axios');
const pg = require('pg');
const bodyParser = require('body-parser');
const env = require('dotenv')

env.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    database: process.env.PG_DB,
    host: process.env.PG_HOST,
    password:process.env.PG_KEY,
    port: process.env.PG_PORT
});

db.connect((err) => {
    if (err) {
        console.error(err.stack);
    } else {
        console.log('Database is connected successfully!');
    }
});

const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));

app.get('/', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM books ORDER BY books DESC;"); 
        const data = result.rows;

        res.render("index.ejs", {
            books: data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while fetching books.");
    }
});

app.get("/view/:id", async (req, res) => {
  try {
    const id = req.params.id;

     const result = await db.query("SELECT * FROM books WHERE id= $1",[id])
     const data = result.rows[0];

     if (!id){
        res.status(404).send('Book not found!')
     } else{
        res.render("./view.ejs",{
            book:data
        })
     }
     
  } catch (err) {
    res.status(500).send("An error occurred while adding the book.");
  }
})

app.get("/new", (req, res) => {
    res.render("./new.ejs");
});


app.post("/add", async (req, res) => {
    const { title, desc, isbn, rate } = req.body;

    try {
        const date = new Date().toLocaleString();
        const cover_url = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
        
        await db.query(
            "INSERT INTO books(title, content, date, isbn, cover_url, rating) VALUES ($1, $2, $3, $4, $5, $6);",
            [title, desc, date, isbn, cover_url, rate]
        );
        res.redirect("/");
    } catch (err) {
        res.status(500).send("An error occurred while adding the book.");
    }
});


app.get("/edit/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);

        if (result.rows.length > 0) {
            const book = result.rows[0];
            res.render("edit.ejs", { book });
        } else {
            res.status(404).send("Book not found.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while fetching the book for editing.");
    }
});


app.post("/update/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { updatedTitle, updatedDesc, updatedIsbn, updatedRate } = req.body;

        if (!id){
            return res.status(400).send("Missing fields. All fields are required.");
        }

        await db.query(
            "UPDATE books SET title = $1, content = $2, isbn = $3, rating = $4 WHERE id = $5",
            [updatedTitle, updatedDesc, updatedIsbn, updatedRate, id]
        );
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while updating the book.");
    }
});

app.post("/delete", async (req, res) => {
    try {
        const id = req.body.id;

        if (!id) {
            return res.status(400).send("Missing book ID.");
        }

        await db.query("DELETE FROM books WHERE id = $1;", [id]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while deleting the book.");
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
