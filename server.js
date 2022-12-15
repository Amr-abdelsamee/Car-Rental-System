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
//? npm install express-fileupload
//TODO: to run the server type: nodemon server.js


require('dotenv').config(); // for .env file
const express = require("express"); // express module for routes
const fileUpload = require('express-fileupload');
const mysql = require("mysql") // mysql database
const bodyParser = require("body-parser"); // for requestes parsing

const favicon = require('serve-favicon'); // for icon
//const chalk = require("chalk") // for console colors
const Get_Color_Name = require("hex-color-to-color-name")

const fs = require('fs'); // for images

const app = express();
app.set('views', __dirname + '/views/');
app.set('view engine', 'ejs');
app.use(fileUpload());
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
    database: "car_rental",
    multipleStatements: true
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
        res.redirect("/main")
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
//used whhen admin login
function loadAllImages() {
    fs.mkdir('public\\images\\cars', { recursive: true }, (err) => {
        if (err) throw err;
    });
    let sql = "SELECT car_id,image FROM cars";
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            for (var i = 0; i < result.length; i++) {
                let imageName = result[i].car_id
                let buffer = Buffer.from(result[i].image, 'binary');
                fs.writeFile('public\\images\\cars\\' + imageName + '.jpg', buffer, function (err, written) {
                    if (err) console.log(err);
                    else {
                        console.log("Image " + imageName + ".jpg successfully loaded!");
                    }
                });
            }
        }
    })
}
//used in add cars
function loadLastImages() {
    let sql = "SELECT car_id,image FROM cars WHERE car_id IN(SELECT  max(car_id) FROM cars )";
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            let imageName = result[0].car_id
            let buffer = Buffer.from(result[0].image, 'binary');
            fs.writeFile('public\\images\\cars\\' + imageName + '.jpg', buffer, function (err, written) {
                if (err) console.log(err);
                else {
                    console.log("Image " + imageName + ".jpg successfully loaded!");
                }
            });
        }
    })
}
//? ---------------------------------------------< Admin route section >-------------------------------------------------------
app.route("/admin")
    .get(function (req, res) {
        res.render("control/admin_signIn")
    })
    .post(function (req, res) {
        var current_admin = ""
        if (req.body.signIn_btn === "signin") {
            const VALUES = [req.body.password, req.body.username]
            sql = "SELECT * FROM `admins` WHERE `password`= ? AND email=?";
            db.query(sql, VALUES, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    if (result.length) {
                        current_admin = VALUES[1]
                        loadAllImages()
                        sql = "SELECT * FROM cars AS C JOIN offices AS O WHERE C.office_id=O.office_id";
                        db.query(sql, (err, result2) => {
                            if (err) {
                                console.log(err)
                            } else {
                                res.render("control/dashboard", { admin: current_admin, cars: result2 })
                            }
                        })
                    } else {
                        // error message should be added here ------------------------------<
                        res.redirect("/admin")
                    }
                }
            })

        } else if (req.body.control_btn) {
            let menu_btn = req.body.control_btn;
            let sql = ""
            switch (menu_btn) {
                case "dashboard":
                    sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id";
                    db.query(sql, (err, result2) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render("control/dashboard", { admin: current_admin, cars: result2 })
                        }
                    })
                    break;
                case "all_cars":
                    sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render("control/all_cars", { cars: result })
                        }
                    })
                    break;
                case "all_customers":
                    sql = "SELECT * FROM customers";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render("control/all_customers", { customers: result })
                        }
                    })
                    break;
                case "reservations":
                    sql = "SELECT reserve_no, fname, lname, car_id, startD, endD FROM reservations AS R JOIN customers AS C ON R.customer_id=C.customer_id";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log(result)
                            res.render("control/reservations", { reservations: result })
                        }
                    })
                    break;
                case "setting":
                    sql = "SELECT * FROM admins";
                    db.query(sql, (err, result1) => {
                        if (err) {
                            console.log(err)
                        } else {
                            sql = "SELECT * FROM offices";
                            db.query(sql, (err, result2) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    res.render("control/setting", { admins: result1, offices: result2 })
                                }
                            })
                        }
                    })
                    break;
                case "add_car":
                    sql = "SELECT * FROM offices";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render("control/add_car", { offices: result })
                        }
                    })
                    break;
                case "add_customer":
                    res.render("control/add_customer")
                    break;
                case "add_admin":
                    res.render("control/add_admin")
                    break;
                case "add_office":
                    res.render("control/add_office")
                    break;
                case "add_res":
                    sql = "SELECT * FROM cars; SELECT * from customers";
                    db.query(sql, (err, results) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.render("control/admin_reserve", { cars: results[0], customers: results[1] })
                        }
                    })
            }
        }
    });

app.route("/add")
    .post(function (req, res) {
        let sql = ""
        if (req.body.control_btn === "add_car") {
            const { image } = req.files
            console.log(image.data)
            const color_name = Get_Color_Name.GetColorName(req.body.color);
            const VALUES = [
                null
                , req.body.company
                , req.body.model
                , req.body.lic_no
                , color_name
                , req.body.stat
                , parseInt(req.body.year)
                , parseInt(req.body.miles)
                , parseInt(req.body.price)
                , parseInt(req.body.office)
                , image.data
            ]
            sql = "INSERT INTO cars VALUES (?)";
            db.query(sql, [VALUES], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("NEW car added to the system!")
                    console.log(VALUES)
                    // success message should be added here ------------------------------<
                    loadLastImages()
                    res.redirect("/admin")
                }
            })


        } else if (req.body.control_btn === "add_customer") {

            const VALUES = [
                null
                , req.body.fname
                , req.body.lname
                , req.body.email
                , req.body.password
                , req.body.address
                , req.body.phone
            ]

            sql = "INSERT INTO customers VALUES (?)";
            db.query(sql, [VALUES], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("NEW customer added to the system!")
                    console.log(VALUES)
                    // success message should be added here ------------------------------<
                    res.redirect("/admin")
                }
            })
        } else if (req.body.control_btn === "add_admin") {
            const VALUES = [
                req.body.email
                , req.body.password
            ]
            sql = "INSERT INTO admins (email,password) VALUES (?)";
            db.query(sql, [VALUES], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("NEW admin added to the system!")
                    console.log(VALUES)
                    // success message should be added here ------------------------------<
                    res.redirect("/admin")
                }
            })
        } else if (req.body.control_btn === "add_office") {
            const VALUES = [
                null
                , req.body.location
            ]
            sql = "INSERT INTO offices VALUES (?)";
            db.query(sql, [VALUES], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("NEW office added to the system!")
                    console.log(VALUES)
                    // success message should be added here ------------------------------<
                    res.redirect("/admin")
                }
            })
        } else if (req.body.control_btn === "add_res") {
            const VALUES = [
                null
                , req.body.customer_id
                , req.body.car_id
                , req.body.sdate
                , req.body.edate
            ]
            sql = "INSERT INTO reservations VALUES (?)";
            db.query(sql, [VALUES], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("NEW reservation is made!")
                    console.log(VALUES)
                    // success message should be added here ------------------------------<
                    res.redirect("/admin")
                }
            })
        }
    });

app.route("/delete")
    .post(function (req, res) {
        let sql = ""

        // to delete a car
        if (req.body.car_lic) {
            if (req.body.delete_control_btn === "delete_car") {
                sql = "DELETE FROM cars WHERE lic_no = ?";
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
            if (req.body.delete_control_btn === "delete_customer") {
                sql = "DELETE FROM customers WHERE customer_id = ?";
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
            if (req.body.delete_control_btn === "delete_admin") {
                sql = "DELETE FROM admins WHERE email = ?";
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


        // to delete an office
        if (req.body.office_id) {
            if (req.body.delete_control_btn === "delete_office") {
                sql = "DELETE FROM offices WHERE office_id = ?";
                const VALUE = req.body.office_id
                db.query(sql, VALUE, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("An admin deleted an office from the system!")
                        res.redirect("/admin")
                    }
                })
            }
        }

        // to delete a reservation
        if (req.body.reserve_no) {
            if (req.body.delete_control_btn === "delete_res") {
                console.log(2)
                sql = "DELETE FROM reservations WHERE reserve_no = ?";
                const VALUE = req.body.reserve_no
                db.query(sql, VALUE, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("An admin deleted a reservation from the system!")
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
        sql = "SELECT * FROM cars AS C JOIN offices AS O WHERE C.office_id=O.office_id";
        db.query(sql, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                res.render("main", { cars: result })
            }
        })

    })
    .post(function (req, res) {

    });

app.route("/overview")
    .get(function (req, res) {
        res.redirect("main");
    })
    .post(function (req, res) {

        const VALUE = [req.body.car_id_btn]
        let sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE C.car_id= ?";
        db.query(sql, VALUE, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                res.render("cars/car_overview", { car: result[0] })
            }
        })
    });

app.route("/reserve")
    .get(function (req, res) {
        res.redirect("main");
    })
    .post(function (req, res) {
        const VALUE = [req.body.reserve_btn]
        let sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE C.car_id= ?";
        db.query(sql, VALUE, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                res.render("cars/reserve", { car: result[0] })
            }
        })
    });


//? ---------------------------------------------< End of Main route section >-------------------------------------------------------

app.listen(process.env.PORT || 3000, function () {
    console.log(new Date() + ":: Server started..")
})


