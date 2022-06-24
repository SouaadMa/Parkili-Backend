const express = require("express")

const app = express()
app.use(express.json())


const port = 3000
app.use(express.static('static'))

var mysql = require('mysql')
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'kouskous',
  database: 'parkili_db'
})

app.set("port", port)

app.get("/parkings/", (req, res) => {

    connection.query('SELECT * FROM parkings', function (err, rows, fields) {
    if (err) throw err

    console.log('First id: ', rows[0].parking_id)
    res.json(rows)
    })

})

app.get("/schedules/", (req, res) => {

    connection.query('SELECT * FROM openSchedule', function (err, rows, fields) {
    if (err) throw err

    console.log('First id -- schedules: ', rows[0].parking_id)
    res.json(rows)
    })

})

app.get("/parkings/:title", (req, res) => {

    res.json(parkings.find((e) => e.title == req.params.title))
    // res.send("hello")
})

app.post("/users/login", (req, res) => {
    console.log(req.body)
    var f_email = req.body.email;
    var f_pwd = req.body.pwd;

    var sql = `SELECT * FROM users WHERE email = '${f_email}' AND pwd = '${f_pwd}';`
    console.log(sql);
    connection.query(sql, function(err, result) {
        if (err) throw err;
        if (result[0]){
            console.log(result);
            return res.json({
                userId: result[0].user_id,
                email: result[0].email,
                fullname: result[0].fullname
            })
        }
        else return res.status(404).end();
    });
})

app.post("/users/add", (req, res) => {

    var f_name = req.body.fullname;
    var email = req.body.email;
    var pn = req.body.phonenum;
    var pwd = req.body.pwd;
    
    var sql = `INSERT INTO users (fullname, email, phonenum, pwd) VALUES ("${f_name}", "${email}", "${pn}", "${pwd}")`;
    connection.query(sql, function(err, result) {
        if (err) throw err;
        console.log('user inserted');
        res.send({ fullname: f_name, email: email, phonenum: pn, pwd: pwd });
    });
})


app.get("/reservations/:userId", (req, res) => {
    console.log(req.params.userId);
    var f_userId = req.params.userId;

    var sql = `SELECT p.name as parking_name, pay.totalPrice as totalPrice, date, entrytime, exittime, spotnum, rating FROM reservations r, parkings p, payments pay WHERE r.parking_id = p.parking_id AND r.reservation_id = pay.reservation_id AND r.user_id = '${f_userId}';`
    console.log(sql);
    connection.query(sql, function(err, result) {
        if (err) throw err;
        if (result[0]){
            return res.json(result)
        }
        else return res.status(404).end();
    });
})


app.post("/reviews/add", (req, res) => {
    

    var f_note = req.body.note;
    var f_comment = req.body.comment;

    var sql = `INSERT INTO reviews (note, comment) VALUES ("${f_note}", "${f_comment}")`;
    connection.query(sql, function(err, result) {
        if (err) throw err;
        console.log('review inserted ' + f_note);
        res.redirect('/');
    });

})




app.listen(3000,() => {
    console.log(app.get("port"))
})