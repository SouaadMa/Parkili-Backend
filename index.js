
const express = require("express")
const geolib = require("geolib")

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

app.get("/parkings/nearest/:lat/:lng", (req, res) => {

    console.log('Nearest for Lat: ', req.params.lat, 'Lng: ', req.params.lng)
    
    connection.query('SELECT * FROM parkings', function (err, rows, fields) {
    if (err) throw err

    console.log('First id: ', rows[0].parking_id)

    for (let index = 0; index < rows.length; index++) {
        const parking = rows[index];
        
        parking.distance = geolib.getDistance(
            { latitude: parking.positionlat, longitude: parking.positionlng },
            { latitude: req.params.lat, longitude : req.params.lng }
        )

    }

    rows.sort(sortFunction)

    console.log('Nearest id: ', rows[0].parking_id)
    console.log('Second nearest id: ', rows[1].parking_id)


    function sortFunction(a, b) {
        return (a.distance - b.distance) ;
    }

    console.log(rows);
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



app.get("/parkings/:location", (req, res) => {
    var f_location = req.params.location
    console.log('Search for Location: ', f_location)
    connection.query(`SELECT * FROM parkings WHERE commune = "${f_location}"`, function (err, rows, fields) {
        if (err) throw err
        if(rows.length > 0) {
            console.log('First id: ', rows[0].parking_id)
        } else {
            console.log('no matching parkings')
        }
        res.json(rows)

    })
})

app.get("/parkings/:name", (req, res) => {
    var f_title = req.params.name
    console.log('Search for Title: ', f_location)
    connection.query(`SELECT * FROM parkings WHERE name = "${f_title}"`, function (err, rows, fields) {
        if (err) throw err
        if(rows.length > 0) {
            console.log('First id: ', rows[0].parking_id)
        } else {
            console.log('no matching parkings')
        }
        res.json(rows)

    })
})

app.get("/parkings/:location/:price/:distance", (req, res) => {
    var f_price = req.params.price
    var f_distance = req.params.distance
    var f_location = req.params.location
    console.log('Search for Price ', f_price, ' & Location: ', f_location)
    connection.query(`SELECT * FROM parkings WHERE priceperhour <= "${f_price}" AND commune = "${f_location}";`, function (err, rows, fields) {
        if (err) throw err
        if(rows.length > 0) {
            console.log('First id: ', rows[0].parking_id)
        } else {
            console.log('no matching parkings')
        }
        res.json(rows)

    })
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

    var sql = `SELECT r.user_id, r.parking_id, r.reservation_id, p.name as parking_name, pay.totalPrice as totalPrice, pay.paymentMethod, date, entrytime, exittime, spotnum FROM reservations r, parkings p, payments pay WHERE r.parking_id = p.parking_id AND r.reservation_id = pay.reservation_id AND r.user_id = '${f_userId}';`
    console.log(sql);
    connection.query(sql, function(err, result) {
        if (err) throw err;
        if (result[0]){
            return res.json(result)
        }
        else return res.status(404).end();
    });
})

app.post("/reservations/add", (req, res) => {
    var userId = req.body.user_id;
    var parkingId = req.body.parking_id;
    var reservationdate = todaysdate();
    var startdate = req.body.entrytime;
    var enddate = req.body.exittime;
    var spotnum = 12; /* to generate */
    var rating = 0;
    var paymentmethod = req.body.paymentMethod;
    var totalPrice = req.body.totalPrice;
    
    var sql = `INSERT INTO reservations (user_id, parking_id, date, entrytime, exittime, spotnum) VALUES ("${userId}", "${parkingId}", "${reservationdate}", "${startdate}", "${enddate}", "${spotnum}");`;
    connection.query(sql, function(err, result) {
        if (err) throw err;
        reservation_id = result.insertId;
        console.log('reservation inserted ', reservation_id);

        sql = `INSERT INTO payments (reservation_id, paymentMethod, totalPrice) VALUES ("${result.insertId}", "${paymentmethod}", "${totalPrice}")`;

        connection.query(sql, function(err, result) {
            if (err) throw err;
            console.log('payment inserted ', result.insertId);

            res.send({ reservation_id : reservation_id, user_id: userId, parking_id: parkingId, spotnum: spotnum, paymentMethod: paymentmethod, parking_name : req.body.parking_name, totalPrice : totalPrice });
        });
    });
})

function todaysdate() {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();

    return year+'/'+month+'/'+date+' '+hours+':'+minutes
}


app.post("/reviews/add", (req, res) => {
    

    var f_note = req.body.note;
    var f_comment = req.body.comment;
    var f_user = req.body.user_id;
    var f_parking = req.body.parking_id;
    
        var sql = `INSERT INTO reviews (review_id, parking_id, note, comment) VALUES ("${f_parking}${f_user}", "${f_parking}", "${f_note}", "${f_comment}")`;
        connection.query(sql, function(err, result) {
            if (err) {
                var sql = `UPDATE reviews SET note = "${f_note}", comment = "${f_comment}" WHERE review_id = "${f_parking}${f_user}"`;
                connection.query(sql, function(err, result) {
                    if (err) throw err;
                    console.log('review updated ' + f_note);
                });
            }
            else console.log('review inserted ' + f_note);
            res.redirect('/');
        });
    

})

app.get("/reviews/:parkingid", (req, res) => {
    
    var f_parking = req.params.parkingid;

    var sql = `SELECT AVG(note) as note FROM reviews GROUP BY parking_id HAVING parking_id = "${f_parking}";`;
    connection.query(sql, function(err, result) {
        if (err) throw err;
        console.log(result)
        if (result[0]){
            res.send({ note : result[0].note })
        }
        else return res.status(404).end();
    });

})



app.listen(3000,() => {
    console.log(app.get("port"))
})