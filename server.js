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
//? npm install hex-color-to-color-name
//TODO: to run the server type: nodemon server.js


require('dotenv').config(); // for .env file
const express = require("express"); // express module for routes
const mysql = require("mysql") // mysql database
const bodyParser = require("body-parser"); // for requestes parsing

const favicon = require('serve-favicon'); // for icon
//const chalk = require("chalk") // for console colors
const Get_Color_Name = require("hex-color-to-color-name")


const app = express();
app.set('views', __dirname + '/views/');
app.set('view engine', 'ejs');
app.use(express.static("public"));
// app.use(express.static(path.join('public'))); // CSS location
// app.use(express.static(path.join('app'))); //js location

app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(__dirname + '/public/images/favicon.png')); // favicon location


//? ---------------------------------------------< Database section >--------------------------------------------------------
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "car_rental"
});

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(">>> Database connected !")
    }
});



//? -------------------------------------------< End of Database Section >-------------------------------------------------------


//? ---------------------------------------------< Root route section >--------------------------------------------------------
app.route("/")
    .get(function (req, res) {
        res.render("main")
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

//? ---------------------------------------------< Admin route section >-------------------------------------------------------
app.route("/admin")
    .get(function (req, res) {
        res.render("control/admin_signIn")
    })
    .post(function (req, res) {
        var current_admin = ""
        if (req.body.signIn_btn === "signin") {
            const VALUES = [req.body.password, req.body.username]
            sql = "SELECT * FROM `admin` WHERE `password`= ? AND email=?";
            db.query(sql, VALUES, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    if (result.length) {
                        current_admin = VALUES[1]
                        res.render("control/dashboard", { admin: current_admin })
                    } else {
                        res.redirect("/admin")
                    }
                }
            })

        } else if (req.body.control_btn) {
            let menu_btn = req.body.control_btn;
            let sql = ""
            switch (menu_btn) {
                case "dashboard":
                    res.render("control/dashboard", { admin: current_admin })
                    break;
                case "all_cars":
                    sql = "SELECT * FROM car";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render("control/all_cars", { cars: result })
                        }
                    })
                    break;
                case "all_customers":
                    sql = "SELECT * FROM customer";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render("control/all_customers", { customers: result })
                        }
                    })
                    break;
                case "reservations":
                    sql = "SELECT * FROM reservation ";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render("control/reservations", { reservations: result })
                        }
                    })
                    break;
                case "setting":
                        sql = "SELECT * FROM admin";
                        db.query(sql, (err, result) => {
                            if (err) {
                                console.log(err)
                            } else {
                                res.render("control/setting", { admin: result })
                            }
                        })
                        break;
                case "add_car":
                    res.render("control/add_car")
                    break;
                case "add_customer":
                    res.render("control/add_customer")
                    break;
                    case "add_admin":
                        res.render("control/add_admin")
                        break;
            }
        }
    });

app.route("/add")
    .post(function (req, res) {
        let sql = ""
        if (req.body.control_btn === "add_car") {
            const color_name = Get_Color_Name.GetColorName(req.body.color);
            let new_car = {
                company: req.body.company,
                color: color_name,
                stat: req.body.stat,
                office: req.body.office,
                model: req.body.model,
                year: req.body.year,
                miles: req.body.miles,
                price: req.body.price,
                lic_no: req.body.lic_no,
                image_path: null,
            };

            sql = "INSERT INTO car VALUES (?)";
            const VALUES = [
                null
                , new_car.company
                , new_car.color
                , new_car.stat
                , new_car.office
                , new_car.model
                , parseInt(new_car.year)
                , parseInt(new_car.miles)
                , parseInt(new_car.price)
                , new_car.lic_no
                , null
            ]
            db.query(sql, [VALUES], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("NEW car added to the system!")
                    console.log(new_car)
                    res.redirect("/admin")
                }
            })


        } else if (req.body.control_btn === "add_customer") {
            let new_customer = {
                fname: req.body.fname,
                lname: req.body.lname,
                email: req.body.email,
                password: req.body.password,
                address: req.body.address,
                phone: req.body.phone,
            };

            sql = "INSERT INTO customer VALUES (?)";
            const VALUES = [
                null
                , new_customer.fname
                , new_customer.lname
                , new_customer.email
                , new_customer.password
                , new_customer.address
                , parseInt(new_customer.phone)
            ]
            db.query(sql, [VALUES], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("NEW customer added to the system!")
                    console.log(new_customer)
                    res.redirect("/admin")
                }
            })
        } else if (req.body.control_btn === "add_admin") {
            let new_admin = {
                email: req.body.email,
                password: req.body.password,
            };

            sql = "INSERT INTO admin (email,password) VALUES (?)";
            const VALUES = [
                new_admin.email
                , new_admin.password
            ]
            db.query(sql, [VALUES], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("NEW admin added to the system!")
                    console.log(new_admin)
                    res.redirect("/admin")
                }
            })
        }
    });

app.route("/delete")
    .post(function (req, res) {
        // to delete a car
        if (req.body.car_lic) {
            let sql = ""
            if (req.body.control_btn === "delete_car") {
                sql = "DELETE FROM car WHERE lic_no = ?";
                const VALUE = req.body.car_lic
                db.query(sql, VALUE, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("An admin deleted a car from the system!")
                        res.redirect("/admin")
                    }
                })
            }
        }

        // to delete a customer
        if (req.body.customer_id) {
            if (req.body.control_btn === "delete_customer") {
                sql = "DELETE FROM customer WHERE customer_id = ?";
                const VALUE = req.body.customer_id
                db.query(sql, VALUE, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("An admin deleted a customer from the system!")
                        res.redirect("/admin")
                    }
                })
            }
        }

                // to delete an admin
                if (req.body.admin_email) {
                    if (req.body.control_btn === "delete_admin") {
                        sql = "DELETE FROM admin WHERE email = ?";
                        const VALUE = req.body.admin_email
                        db.query(sql, VALUE, (err, result) => {
                            if (err) {
                                console.log(err)
                            } else {
                                console.log("An admin deleted another from the system!")
                                res.redirect("/admin")
                            }
                        })
                    }
                }


    });
//? -------------------------------------------< End of sign up route section >-------------------------------------------------


//? ---------------------------------------------< Sign in route section >-------------------------------------------------------
app.route("/signin")
    .get(function (req, res) {
        res.render("signIn")
    })
    .post(function (req, res) {
        const VALUES = [req.body.password, req.body.username]
        sql = "SELECT * FROM `customer` WHERE `password`= ? AND email=?";
        db.query(sql, VALUES, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                if (result.length) {
                    current_admin = VALUES[1]
                    res.redirect("main")
                } else {
                    res.redirect("/signin")
                }
            }
        })
    });
//? -------------------------------------------< End of sign in route section >-------------------------------------------------



//? ---------------------------------------------< Sign up route section >-------------------------------------------------------
app.route("/signup")
    .get(function (req, res) {
        res.render("signUp")
    })
    .post(function (req, res) {
        let new_customer = {
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address,
            phone: req.body.phone,
        };

        sql = "INSERT INTO customer VALUES (?)";
        const VALUES = [
            null
            , new_customer.fname
            , new_customer.lname
            , new_customer.email
            , new_customer.password
            , new_customer.address
            , parseInt(new_customer.phone)
        ]
        db.query(sql, [VALUES], (err, result) => {
            if (err) {
                console.log(err)
            } else {
                console.log("NEW customer added to the system!")
                console.log(new_customer)
                res.redirect("/signin")
            }
        })
    });
//? -------------------------------------------< End of sign up route section >-------------------------------------------------



//? ---------------------------------------------< Sign out route section >-------------------------------------------------------
app.route("/signout")
    .post(function (req, res) {

    })
//? ---------------------------------------------< End of Sign out route section >-------------------------------------------------------
//? ---------------------------------------------< Profile route section >-------------------------------------------------------
app.route("/profile")
    .get(function (req, res) {
        res.render("profile")
    })
//? ---------------------------------------------< End of profile route section >-------------------------------------------------------


//? ---------------------------------------------< Main route section >-------------------------------------------------------
app.route("/main")
    .get(function (req, res) {
        res.render("main")
    })
    .post(function (req, res) {

    });

app.route("/overview")
    .get(function (req, res) {
        res.render("cars/car_overview.ejs")
    })
    .post(function (req, res) {

    });

    app.route("/reserve")
    .get(function (req, res) {
        res.render("cars/reserve.ejs")
    })
    .post(function (req, res) {
        
    });


//? ---------------------------------------------< End of Main route section >-------------------------------------------------------

app.listen(process.env.PORT || 3000, function () {
    console.log(new Date() + ":: Server started..")
})


