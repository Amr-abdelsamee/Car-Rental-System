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
const mysql = require("mysql") // mysql database
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
// const db = mysql.createConnection({
//     host: "localhost",
//     user:"root",
//     password: "",
//     database: "car_rental"
// });

// db.connect((err)=>{
//     if(err){
//         console.log(err);
//     }else{
//         console.log(">>> Database connected !")
//     }
// });

// let sql = "SELECT * FROM admin";
// db.query(sql,(err,result)=>{
//     if(err){
//         console.log(err)
//     }else{
//         console.log(result)
//     }
// })




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

//? ---------------------------------------------< Admin route section >-------------------------------------------------------
app.route("/admin")
    .get(function (req, res) {
        res.render("control/dashboard", { admin: "Amr ABSO" })

    })
    .post(function (req, res) {
        let menu_btn = req.body.control_btn;
        res.render("control/" + menu_btn, { admin: "Amr ABSO" })
    });

app.route("/add")
    .post(function (req, res) {
        console.log(req.body.control_btn)
        if (req.body.control_btn === "add_car") {
            let new_car = {
                company: req.body.company,
                color: req.body.color,
                stat: req.body.stat,
                office: req.body.office,
                model: req.body.model,
                year: req.body.year,
                miles: req.body.miles,
                price: req.body.price,
                lic_no: req.body.lic_no,
                image_path: req.body.image,
            };
            console.log(new_car)
        } else if (req.body.control_btn === "add_customer") {
            let new_car = {
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                address: req.body.address,
                phone: req.body.phone,
            };
            console.log(new_car)
        }
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


