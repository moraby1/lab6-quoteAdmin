import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));

const conn = mysql.createPool({
    host: "sql5.freesqldatabase.com",
    user: "sql5823109",
    password: "j21ETqWgXz",
    database: "sql5823109",
    connectionLimit: 10
});

// --- ROUTES ---
app.get('/', (req, res) => res.render('index'));

// --- AUTHORS ---
app.get('/authors', async (req, res) => {
    const [rows] = await conn.query("SELECT * FROM q_authors ORDER BY lastName");
    res.render("authorList", {"authors": rows});
});

app.get('/author/new', (req, res) => res.render('newAuthor'));

app.post("/author/new", async (req, res) => {
    let { fName, lName, birthDate, deathDate, sex, profession, country, portrait, biography } = req.body;
    let sql = `INSERT INTO q_authors (firstName, lastName, dob, dod, sex, profession, country, portrait, biography) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        await conn.query(sql, [fName, lName, birthDate, deathDate || null, sex, profession, country, portrait, biography]);
        res.render("newAuthor", { "message": "Author added successfully!" });
    } catch (err) { res.render("newAuthor", { "message": "Error adding author." }); }
});

app.get("/author/edit", async (req, res) => {
    let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO, DATE_FORMAT(dod, '%Y-%m-%d') dodISO FROM q_authors WHERE authorId = ?`;
    const [rows] = await conn.query(sql, [req.query.authorId]);
    res.render("editAuthor", { "authorInfo": rows });
});

app.post("/author/edit", async (req, res) => {
    let { fName, lName, dob, dod, sex, profession, country, portrait, biography, authorId } = req.body;
    let sql = `UPDATE q_authors SET firstName=?, lastName=?, dob=?, dod=?, sex=?, profession=?, country=?, portrait=?, biography=? WHERE authorId=?`;
    await conn.query(sql, [fName, lName, dob, dod || null, sex, profession, country, portrait, biography, authorId]);
    res.redirect("/authors");
});

app.get('/author/delete', async (req, res) => {
    await conn.query("DELETE FROM q_authors WHERE authorId = ?", [req.query.authorId]);
    res.redirect('/authors');
});

// --- QUOTES ---
app.get('/quotes', async (req, res) => {
    let sql = `SELECT q.*, a.firstName, a.lastName FROM q_quotes q 
               JOIN q_authors a ON q.authorId = a.authorId ORDER BY q.quoteId DESC`;
    const [rows] = await conn.query(sql);
    res.render('quoteList', { quotes: rows });
});

app.get('/quote/new', async (req, res) => {
    const [authors] = await conn.query("SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName");
    const [categories] = await conn.query("SELECT DISTINCT category FROM q_quotes");
    res.render('newQuote', { authors, categories });
});

app.post('/quote/new', async (req, res) => {
    let { quote, authorId, category } = req.body;
    let sql = `INSERT INTO q_quotes (quote, authorId, category) VALUES (?, ?, ?)`;
    await conn.query(sql, [quote, authorId, category]);
    res.redirect('/quotes');
});

app.get('/quote/edit', async (req, res) => {
    const [quoteData] = await conn.query("SELECT * FROM q_quotes WHERE quoteId = ?", [req.query.quoteId]);
    const [authors] = await conn.query("SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName");
    const [categories] = await conn.query("SELECT DISTINCT category FROM q_quotes");
    res.render('editQuote', { quoteData: quoteData[0], authors, categories });
});

app.post('/quote/edit', async (req, res) => {
    let { quote, authorId, category, quoteId } = req.body;
    let sql = `UPDATE q_quotes SET quote=?, authorId=?, category=? WHERE quoteId=?`;
    await conn.query(sql, [quote, authorId, category, quoteId]);
    res.redirect('/quotes');
});

app.get('/quote/delete', async (req, res) => {
    await conn.query("DELETE FROM q_quotes WHERE quoteId = ?", [req.query.quoteId]);
    res.redirect('/quotes');
});

app.listen(3000, () => console.log("Express server running"));