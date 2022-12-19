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
const session = require("express-session");
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

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: "thisismysecrctekey",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));

var app_session;

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
        console.log(new Date().toLocaleString() + ":: Database connected !")
    }
});



//? -------------------------------------------< End of Database Section >-------------------------------------------------------


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
function loadOneImage(lic_no) {
    // IN(SELECT  max(car_id) FROM cars )
    let sql = "SELECT car_id,image FROM cars WHERE lic_no=?";
    db.query(sql, lic_no, (err, result) => {
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
app.route("/control")
    .get(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
            res.redirect("admin")
        } else {
            res.render("control/admin_signIn")
        }
    })
    .post(function (req, res) {
        app_session = req.session
        const VALUES = [req.body.password, req.body.username]
        let sql = "SELECT * FROM `admins` WHERE `password`= ? AND email=?";
        db.query(sql, VALUES, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                if (result.length) {
                    loadAllImages()
                    sql = "SELECT * FROM cars AS C JOIN offices AS O WHERE C.office_id=O.office_id";
                    db.query(sql, (err, result2) => {
                        if (err) {
                            console.log(err)
                        } else {
                            app_session.admin_id = VALUES[1]
                            app_session.userPermission = false
                            app_session.adminPermission = true
                            console.log(new Date().toLocaleString() + ":: admin logged in")
                            load_dashBoard(VALUES[1], res)
                        }
                    })
                } else {
                    console.log(new Date().toLocaleString() + ":: admin sign in failed!")
                    console.log(VALUES)
                    res.redirect("/control")
                }
            }
        })
    });


app.route("/admin_signout")
    .get(function (req, res) {
        res.redirect("admin")
    })
    .post(function (req, res) {
        req.session.destroy((err) => {
            if (err) {
                return console.log(err);
            }
            console.log(new Date().toLocaleString() + ":: admin logged out")
            res.redirect('/control');
        });
    });

function load_dashBoard(admin, res) {
    let sql1 = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id limit 10;"
    let sql2 = "SELECT COUNT(car_id) AS count FROM cars;"
    let sql3 = "SELECT COUNT(customer_id) AS count FROM customers;"
    let sql4 = "SELECT COUNT(reserve_no) AS count FROM reservations;";
    let sql5 = "SELECT SUM(DATEDIFF(endD, startD) * C.price) AS total_profits FROM reservations AS R JOIN cars AS C ON R.car_id=C.car_id;"
    let sql6 = "SELECT reserve_no, fname, lname, car_id, startD, endD,res_date FROM reservations AS R JOIN customers AS C ON R.customer_id=C.customer_id ORDER BY  res_date DESC  limit 10;"
    let sql = sql1 + sql2 + sql3 + sql4 + sql5 + sql6
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err)
        } else {
            res.render("control/dashboard", {
                admin: admin,
                cars: results[0],
                cars_count: results[1][0].count,
                customers_count: results[2][0].count,
                res_count: results[3][0].count,
                total_profits: results[4][0].total_profits,
                recent_res: results[5],
            })
        }
    })
}


app.route("/admin")
    .get(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
            load_dashBoard(app_session.admin_id, res);
        } else { res.redirect("control") }
    })
    .post(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
            let menu_btn = req.body.control_btn;
            let sql = ""
            switch (menu_btn) {
                case "dashboard":
                    load_dashBoard(app_session.admin_id, res);
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
                    break;

            }
        } else {
            res.redirect("control")
        }
    });


app.route("/add")
    .post(function (req, res) {
        let sql = ""
        let VALUES

        switch (req.body.control_btn) {
            case "add_car":
                const { image } = req.files
                console.log(image.data)
                const color_name = Get_Color_Name.GetColorName(req.body.color);
                VALUES = [
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
                        loadOneImage(req.body.lic_no)
                        res.redirect("/admin")
                    }
                })
                break;

            case "add_customer":
                VALUES = [
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
                break;

            case "add_admin":
                VALUES = [
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
                break;

            case "add_office":
                VALUES = [
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
                break;

            case "add_res":
                VALUES = [
                    req.body.customer_id
                    , req.body.car_id
                    , req.body.sdate
                    , req.body.edate
                ]
                sql = "INSERT INTO reservations(customer_id, car_id, startD, endD ) VALUES (?)";
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
                break;

        }
    });


app.route("/change")
    .post(function (req, res) {
        if (req.body.index) {
            if (req.body.edit_btn) {
                let sql = ""
                const VALUE = req.body.index
                switch (req.body.edit_btn) {
                    case "edit_car":
                        sql = "SELECT * FROM offices; SELECT * FROM cars WHERE lic_no = ?";
                        db.query(sql, VALUE, (err, result) => {
                            if (err) {
                                console.log(err)
                            } else {
                                res.render("control/edit_car", { offices: result[0], car: result[1][0] })
                            }
                        })
                        break;
                    case "edit_customer":
                        sql = "SELECT * FROM customers WHERE customer_id=?";
                        db.query(sql, VALUE, (err, result) => {
                            if (err) {
                                console.log(err)
                            } else {
                                res.render("control/edit_customer", { customer: result[0] })
                            }
                        })
                        break;
                }
            }
            else if (req.body.delete_btn) {
                delete_entry(req.body.delete_btn, req.body.index, res)
                res.redirect(req.get('referer'));
            }
        } else {
            //returns a 204 No Content response
            res.status(204).send()
        }
    })


function delete_entry(btn_value, data_index) {
    let sql = ""
    const VALUE = data_index
    console.log(btn_value, "___", data_index)

    switch (btn_value) {
        // to delete a car
        case "delete_car":
            sql = "DELETE FROM cars WHERE lic_no = ?";
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("An admin deleted a car from the system!")
                }
            })
            break;

        // to delete a customer
        case "delete_customer":
            sql = "DELETE FROM customers WHERE customer_id = ?";
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("An admin deleted a customer from the system!")

                }
            })
            break;

        // to delete an admin
        case "delete_admin":
            sql = "DELETE FROM admins WHERE email = ?";
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("An admin deleted another from the system!")
                }
            })
            break;

        // to delete an office
        case "delete_office":
            sql = "DELETE FROM offices WHERE office_id = ?";
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("An admin deleted an office from the system!")
                }
            })
            break;

        // to delete a reservation
        case "delete_res":
            sql = "DELETE FROM reservations WHERE reserve_no = ?";
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("An admin deleted a reservation from the system!")
                }
            })
            break;
    }
    return;
}

app.route("/confirmed")
    .post(function (req, res) {
        let sql = ""
        let VALUES
        switch (req.body.control_btn) {
            case "edit_car":
                const { image } = req.files
                const color_name = Get_Color_Name.GetColorName(req.body.color);
                VALUES = [
                    req.body.company
                    , req.body.model
                    , req.body.lic_no
                    , color_name
                    , req.body.stat
                    , parseInt(req.body.year)
                    , parseInt(req.body.miles)
                    , parseInt(req.body.price)
                    , parseInt(req.body.office)
                    , image.data
                    , req.body.car_id
                ]

                sql = "UPDATE cars SET  company=?, model=?, lic_no=?, color=?, `status`=?, `year`=?, miles=?, price=?, office_id=?, `image`= ? WHERE car_id=?";
                db.query(sql, VALUES, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("car with licence No.:", req.body.lic_no, " has been modified!")
                        console.log(VALUES)
                        // success message should be added here ------------------------------<
                        loadOneImage(req.body.lic_no)
                    }
                })
                break;
            case "edit_customer":
                VALUES = [
                    req.body.fname
                    , req.body.lname
                    , req.body.email
                    , req.body.password
                    , req.body.address
                    , req.body.phone
                    , req.body.customer_id
                ]


                sql = "UPDATE customers SET fname=?, lname=?, email=?, `password`=?, `address`=?, phone=? WHERE customer_id=?";
                db.query(sql, VALUES, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("customer information has been modified!")
                        console.log(VALUES)
                        // success message should be added here ------------------------------<
                    }
                })
                break;
        }
        res.redirect("/admin")
    })
//? -------------------------------------------< End of sign up route section >-------------------------------------------------


//? ---------------------------------------------< Root route section >--------------------------------------------------------
app.route("/")
    .get(function (req, res) {
        res.redirect("/main")
    })
    .post(function (req, res) {
    });
//? ---------------------------------------------< End of root route section >---------------------------------------------------



//? ---------------------------------------------< customer Sign in/up/out route section >-------------------------------------------------------
app.route("/signin")
    .get(function (req, res) {
        app_session = req.session
        if (app_session.userPermission) {
            res.redirect("profile")
        }
        else {
            res.render("signIn")
        }

    })
    .post(function (req, res) {
        app_session = req.session
        const VALUES = [req.body.password, req.body.username]
        sql = "SELECT * FROM `customers` WHERE `password`= ? AND email=?";
        db.query(sql, VALUES, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                if (result.length) {
                    app_session.user_id = result[0].customer_id
                    app_session.user_name = result[0].fname + " " + result[0].lname
                    app_session.userPermission = true
                    app_session.adminPermission = false
                    console.log(new Date().toLocaleString() + ":: user logged in")
                    res.redirect("main")
                } else {
                    console.log(new Date().toLocaleString() + ":: sign in failed!")
                    console.log(VALUES)
                    res.redirect("/signin")
                }
            }
        })
    });

app.route("/signup")
    .get(function (req, res) {
        res.render("signUp")
    })
    .post(function (req, res) {
        const VALUES = [
            null
            , req.body.fname
            , req.body.lname
            , req.body.email
            , req.body.password
            , req.body.address
            , parseInt(req.body.phone)
        ]
        sql = "INSERT INTO customers VALUES (?)";
        db.query(sql, [VALUES], (err, result) => {
            if (err) {
                console.log(err)
            } else {
                console.log(new Date().toLocaleString() + ":: NEW customer added to the system!")
                console.log(VALUES)
                res.redirect("/signin")
            }
        })
    });

app.route("/signout")
    .get(function (req, res) {
        res.redirect('/main');
    })
    .post(function (req, res) {
        req.session.destroy((err) => {
            if (err) {
                return console.log(err);
            }
            console.log(new Date().toLocaleString() + ":: user logged out")
            res.redirect('/main');
        });
    })
//? ---------------------------------------< End of customer Sign in/up/out route section >-------------------------------------------------------


//? ---------------------------------------------< Main route section >-------------------------------------------------------
app.route("/main")
    .get(function (req, res) {
        app_session = req.session
        sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id; SELECT * FROM offices";
        db.query(sql, (err, results) => {
            if (err) {
                console.log(err)
            } else {
                let currentDate = new Date().toJSON().slice(0, 10)
                if (app_session.userPermission) {
                    res.render("main", {
                        cars: results[0],
                        hideClass: "",
                        user: app_session.user_name,
                        filters_message: "",
                        offices: results[1],
                        startDate: currentDate
                    })
                }
                else {
                    res.render("main", {
                        cars: results[0],
                        hideClass: "hide-logout",
                        user: "Guest",
                        filters_message: "",
                        offices: results[1],
                        startDate: currentDate
                    })
                }
            }
        })

    })
    .post(function (req, res) {

    });



app.route("/filters")
    .get(function(req, res){
        res.redirect("main")
    })
    .post(function (req, res) {
        app_session = req.session
        let rec_VALUES = {
            office: parseInt(req.body.filter_office),
            company: req.body.filter_company,
            model: req.body.filter_model,
            year: req.body.filter_year,
            lic_no: req.body.filter_lic,
            low_price: req.body.filter_lprice,
            high_price: req.body.filter_hprice,
            sdate: new Date(req.body.filter_sdate).toJSON().slice(0, 10),
            edate: req.body.filter_edate
        }
        let ac_VALUES = []
        let fmessage = ""

        let sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id "
        //  SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE  C.car_id NOT IN (SELECT car_id FROM reservations AS R WHERE (  '2022-12-18' BETWEEN R.startD AND R.endD) OR ( '2022-12-24' BETWEEN R.startD AND R.endD) OR R.startD BETWEEN '2022-12-18' AND '2022-12-24' );


        if (rec_VALUES.office) {
            if (rec_VALUES.office === 0) {
                sql += " WHERE C.office_id"
            } else {
                sql += " WHERE C.office_id=?"
                ac_VALUES.push(rec_VALUES.office)
            }
        }
        if (rec_VALUES.company) {
            if (ac_VALUES.length) {
                sql += " AND "
            } else {
                sql += " WHERE "
            }
            sql += "C.company=?"
            ac_VALUES.push(rec_VALUES.company)
        }
        if (rec_VALUES.model) {
            if (ac_VALUES.length) {
                sql += " AND "
            } else {
                sql += " WHERE "
            }
            sql += "C.model=?"
            ac_VALUES.push(rec_VALUES.model)
        }
        if (rec_VALUES.year) {
            if (ac_VALUES.length) {
                sql += " AND "
            } else {
                sql += " WHERE "
            }
            sql += "C.year=?"
            ac_VALUES.push(rec_VALUES.year)
        }
        if (rec_VALUES.lic_no) {
            if (ac_VALUES.length) {
                sql += " AND "
            } else {
                sql += " WHERE "
            }
            sql += "C.lic_no=?"
            ac_VALUES.push(rec_VALUES.lic_no)
        }
        if (rec_VALUES.low_price) {
            if (ac_VALUES.length) {
                sql += " AND "
            } else {
                sql += " WHERE "
            }
            sql += "C.price >= ?"
            ac_VALUES.push(parseInt(rec_VALUES.low_price))
        }
        if (rec_VALUES.high_price) {
            if (ac_VALUES.length) {
                sql += " AND "
            } else {
                sql += " WHERE "
            }
            sql += "C.price <= ?"
            ac_VALUES.push(parseInt(rec_VALUES.high_price))
        }
"   "

        if (rec_VALUES.sdate) {
            if (!ac_VALUES.length) {
                sql += " WHERE "
            }else{
                sql += " AND"
            }
            sql += " C.car_id NOT IN (SELECT R.car_id FROM reservations AS R WHERE R.startD = ? OR ( ? BETWEEN R.startD AND R.endD)"
            let startDate = rec_VALUES.sdate + " 10:00:00";
            // startDate.setHours(10, 0, 0)
            ac_VALUES.push(startDate)
            ac_VALUES.push(startDate)
        }

        if (rec_VALUES.edate) {
            sql +=" OR R.endD = ? OR ( ? BETWEEN R.startD AND R.endD)"
            let endDate = new Date(rec_VALUES.edate).toJSON().slice(0, 10) + " 09:00:00";
            // endDate.setHours(9, 0, 0)
            ac_VALUES.push(endDate)
            ac_VALUES.push(endDate)
        }




        sql += "); SELECT * FROM offices"
        console.log(rec_VALUES)
        console.log("ac_VALUES: ", ac_VALUES)
        console.log(sql)
        db.query(sql, ac_VALUES, (err, results) => {
            if (err) {
                console.log(err)
            } else {
                if (results[0].length === 0) {
                    fmessage = "No results"
                }
                let currentDate = new Date().toJSON().slice(0, 10)
                if (app_session.userPermission) {
                    res.render("main", {
                        cars: results[0],
                        hideClass: "",
                        user: app_session.user_name,
                        filters_message: fmessage,
                        offices: results[1],
                        startDate: currentDate
                    })
                }
                else {
                    res.render("main", {
                        cars: results[0],
                        hideClass: "hide-logout",
                        user: "Guest",
                        filters_message: fmessage,
                        offices: results[1],
                        startDate: currentDate
                    })
                }
            }
        })

    })


app.route("/overview")
    .get(function (req, res) {
        res.redirect("main");
    })
    .post(function (req, res) {
        const VALUE = req.body.car_id_btn
        let sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE C.car_id= ?";
        db.query(sql, VALUE, (err, results) => {
            if (err) {
                console.log(err)
            } else {
                res.render("cars/car_overview", { car: results[0] })
            }
        })
    });

app.route("/reserve")
    .get(function (req, res) {
        res.redirect("main");
    })
    .post(function (req, res) {
        app_session = req.session
        if (app_session.userPermission) {
            const VALUE = req.body.reserve_btn
            let sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE C.car_id= ?; SELECT startD, endD FROM reservations WHERE car_id=? ORDER BY startD";
            db.query(sql, [VALUE, VALUE], (err, results) => {
                if (err) {
                    console.log(err)
                } else {
                    let currentDate = new Date().toJSON().slice(0, 10)
                    let maxDate = new Date()
                    maxDate.setFullYear(maxDate.getFullYear() + 1)
                    maxDate = maxDate.toJSON().slice(0, 10)
                    // console.log("min date: ", currentDate)
                    // console.log("max date: ", maxDate)
                    res.render("cars/reserve", {
                        car: results[0][0],
                        reservations: results[1],
                        minDate: currentDate,
                        maxDate: maxDate,
                    })
                }
            })
        }
        else {
            res.redirect("signin")
        }
    });



app.route("/confirmReservation")
    .get(function (req, res) {
        res.redirect("main");
    })
    .post(function (req, res) {
        app_session = req.session
        if (app_session.userPermission) {

            let startDate = new Date(req.body.sdate);
            let endDate = new Date(req.body.edate);
            startDate.setHours(10, 0, 0)
            endDate.setHours(9, 0, 0)

            console.log("Dstart ", startDate.toLocaleString())
            console.log("Dtend ", endDate.toLocaleString())

            let start = Date.parse(startDate);
            let end = Date.parse(endDate);

            if (start === end || end < start) {
                res.status(204).send()
            }
            else {
                const VALUE = [
                    req.body.car_id,
                    startDate,
                    endDate,
                    startDate,
                    endDate
                ]
                sql = "SELECT reserve_no,startD,endD FROM reservations AS R  JOIN cars AS C ON R.car_id=C.car_id WHERE R.car_id= ? AND (( ? BETWEEN R.startD AND R.endD OR ? BETWEEN R.startD AND R.endD) OR R.startD BETWEEN ? AND ?)";
                db.query(sql, VALUE, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        if (result.length) {
                            for (let i = 0; i < result.length; i++) {
                                console.log("car can not be reserved:")
                                console.log("res no.:", result[i].reserve_no)
                                console.log("Start date: ", result[i].startD.toLocaleString())
                                console.log("End date: ", result[i].endD.toLocaleString())
                            }
                            res.status(204).send()
                        } else {
                            const VALUE = [
                                app_session.user_id,
                                req.body.car_id,
                                startDate,
                                endDate
                            ]
                            sql = "INSERT INTO reservations(customer_id, car_id, startD, endD ) VALUES (?)";
                            db.query(sql, [VALUE], (err, results) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log(new Date().toLocaleString() + ":: reservation made by user ID:" + app_session.user_id + " car ID:" + req.body.car_id)
                                    res.redirect("main")
                                }
                            })
                        }
                    }
                })
            }
        }
        else {
            res.redirect("signin")
        }
    });


//? ---------------------------------------------< End of Main route section >-------------------------------------------------------

//? ---------------------------------------------< Profile route section >-------------------------------------------------------
app.route("/profile")
    .get(function (req, res) {
        app_session = req.session
        if (app_session.userPermission) {
            const VALUE = [app_session.user_id]
            sql = "SELECT * FROM cars AS C JOIN reservations AS R ON C.car_id=R.car_id WHERE R.customer_id= ?;SELECT * FROM customers WHERE customer_id= ?;";
            db.query(sql, [VALUE, VALUE], (err, results) => {
                if (err) {
                    console.log(err)
                } else {
                    res.render("profile", { cars: results[0], user: results[1][0] })
                }
            })
        }
        else {
            res.redirect("signin")
        }
    })
    .post(function (req, res) {
        if (req.body.car_lic) {
            sql = "DELETE FROM reservations WHERE reserve_no = ?";
            const VALUE = req.body.car_lic
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log("A user canceled a reservation!")
                    res.redirect("/profile")
                }
            })
        } else {
            res.redirect("/profile")
        }
    })
//? ---------------------------------------------< End of profile route section >-------------------------------------------------------


app.listen(process.env.PORT || 3000, function () {
    console.log(new Date().toLocaleString() + ":: Server started..")
})


