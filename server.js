//? npm install express
//? npm install dotenv
//? npm install express-session
//? npm install serve-favicon
//? npm install ejs
//? npm install chalk
//? npm install body-parser
//? npm install -g nodemon
//? npm install url
//? npm install mysql
//TODO: to run the server type: nodemon server.js


require('dotenv').config(); // for .env file
const express = require("express"); // express module for routes
const bodyParser = require("body-parser"); // for requestes parsing


const favicon = require('serve-favicon'); // for icon
//const chalk = require("chalk") // for console colors


const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public")); // CSS location
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(__dirname + '/public/images/favicon.png')); // favicon location


//? ---------------------------------------------< Database section >--------------------------------------------------------
const mysql = require('mysql');
const db= mysql.createConnection ({
    host: "localhost",
    user: "root",
    password: "",
    database: "car_rental",
    connectionLimit: 10
});
db.connect((err)=>{
    if(err) throw err;
    console.log("Connected to database");
});

app.route("/database")
    .get(function(req,res){
        db.query("SELECT * FROM car_rental.cars", (err, result)=>{
            if(err) throw err;  
            console.log(result);
            res.send(result);
        });
    })

//? -------------------------------------------< End of Database Section >-------------------------------------------------------


//? ---------------------------------------------< Root route section >--------------------------------------------------------
app.route("/")
    .get(function (req, res) {
        res.render("main")
        // varr current date
        //for start of the day ast 12 am
    })
    .post(function (req, res) {
        let btnType = req.body.btn;
        if (btnType == "signin") {
            res.redirect("/signin")
        }
        else if (btnType == "signup") {
            res.redirect("/signup")
        }
        else if (btnType == "profile") {
            res.redirect("/profile")
        }
        else {
            res.redirect("/")
        }
    });


//? ---------------------------------------------< End of root route section >---------------------------------------------------



//? ---------------------------------------------< Sign in route section >-------------------------------------------------------
app.route("/signin")
    .get(function (req, res) {
        res.render("signIn")
    })
    .post(function (req, res) {

    });
//? -------------------------------------------< End of sign in route section >-------------------------------------------------



//? ---------------------------------------------< Sign out route section >-------------------------------------------------------
app.route("/signout")
    .post(function (req, res) {

    })
//? ---------------------------------------------< End of Sign out route section >-------------------------------------------------------



//? ---------------------------------------------< Sign up route section >-------------------------------------------------------
app.route("/signup")
    .get(function (req, res) {
        res.render("signUp")
    })
    .post(function (req, res) {

    });
//? -------------------------------------------< End of sign up route section >-------------------------------------------------



app.listen(process.env.PORT || 3000, function () {
    console.log(new Date() + ":: Server started..")
})

//? ---------------------------------------------< Profile route section >-------------------------------------------------------
app.route("/profile")
    .get(function (req, res) {
        res.render("profile")
    })
//? ---------------------------------------------< End of profile route section >-------------------------------------------------------