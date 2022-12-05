//? npm install express
//? npm install dotenv
//? npm install express-session
//? npm install serve-favicon
//? npm install ejs
//? npm install chalk
//? npm install body-parser
//? npm install -g nodemon
//? npm install url
//TODO: to run the server type: nodemon server.js


require('dotenv').config(); // for .env file
const express = require("express"); // express module for routes
const bodyParser = require("body-parser"); // for requestes parsing


const favicon = require('serve-favicon'); // for icon
//const chalk = require("chalk") // for console colors


const app = express();
app.set('views', __dirname + '/views/');
app.set('view engine', 'ejs');
app.use(express.static("public"));
// app.use(express.static(path.join('public'))); // CSS location
// app.use(express.static(path.join('app'))); //js location

app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(__dirname + '/public/images/favicon.png')); // favicon location


//? ---------------------------------------------< Database section >--------------------------------------------------------


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
        else {
            res.redirect("/")
        }
    });
//? ---------------------------------------------< End of root route section >---------------------------------------------------
//? ---------------------------------------------< Sign up route section >-------------------------------------------------------
app.route("/admin")
    .get(function (req, res) {
        res.render("control/dashboard", { admin: "Amr ABSO" })

    })
    .post(function (req, res) {

        let menu_btn = req.body.control_btn;
        console.log(menu_btn)
        res.render("control/" + menu_btn, { admin: "Amr ABSO" })
    });
//? -------------------------------------------< End of sign up route section >-------------------------------------------------


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


