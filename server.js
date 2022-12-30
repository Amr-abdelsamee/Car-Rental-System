//TODO: to run the server type: nodemon server.js

require('dotenv').config(); // for .env file
const express = require("express"); // express module for routes
const session = require("express-session");
const fileUpload = require('express-fileupload');
const md5 = require('md5');
const mysql = require("mysql") // mysql database
const bodyParser = require("body-parser"); // for requestes parsing
const favicon = require('serve-favicon'); // for icon
//const chalk = require("chalk") // for console colors
const Get_Color_Name = require("hex-color-to-color-name")
const fs = require('fs'); // for images
const { log } = require('console');



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
    secret: process.env.SKEY,
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



//? ---------------------------------------------< Admin route section >-------------------------------------------------------
app.route("/control")
    .get(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
            res.redirect("admin")
        } else {
            res.render("control/admin_signIn", {
                error_msg: "",
                error_class: ""
            })
        }
    })
    .post(function (req, res) {
        app_session = req.session
        const VALUES = [
            md5(req.body.password + process.env.SALT),
            req.body.username
        ]
        let sql = "SELECT * FROM `admins` WHERE `password`= ? AND email=?";
        db.query(sql, VALUES, (err, result) => {
            if (err) {
                console.log(err)
                display_filure_user(res, "ERROR! sign in failed!", "Database failed!", "", "")
                res.render("control/admin_signIn", {
                    error_msg: "ERROR!sign in failed please try again!",
                    error_class: ""
                })
            } else {
                if (result.length) {
                    loadAllImages()

                    app_session.admin_id = VALUES[1]
                    app_session.userPermission = false
                    app_session.adminPermission = true
                    console.log(new Date().toLocaleString() + ":: admin logged in")
                    load_dashBoard(VALUES[1], res, "", "", "", "")

                } else {
                    console.log(new Date().toLocaleString() + ":: admin sign in failed!")
                    console.log(VALUES)
                    res.render("control/admin_signIn", {
                        error_msg: "Username or Password is incorrect!!",
                        error_class: "error"
                    })
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


app.route("/admin")
    .get(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
            load_dashBoard(app_session.admin_id, res, "", "", "", "");
        } else { res.redirect("control") }
    })
    .post(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
            let menu_btn = req.body.control_btn;
            let sql = ""
            switch (menu_btn) {

                case "dashboard":
                    load_dashBoard(app_session.admin_id, res, "", "");
                    break;
                case "all_cars":
                    sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id;";
                    sql += "SELECT * FROM offices;"
                    sql += "SELECT * FROM cars WHERE car_id NOT IN(SELECT DISTINCT car_id FROM reservations); ";
                    sql += "SELECT * FROM service_sche;"
                    db.query(sql, (err, results) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                        } else {
                            res.render("control/all_cars", {
                                allCars: results[0],
                                offices: results[1],
                                freeCars: results[2],
                                startDate: new Date().toJSON().slice(0, 10),
                                cars_search_message: "",
                                scheduled_cars: results[3],
                                services_search_message: ""

                            })
                        }
                    })
                    break;
                case "all_customers":
                    sql = "SELECT * FROM customers;";
                    sql += "SELECT * FROM customers where customer_id NOT IN(SELECT DISTINCT customer_id FROM reservations)"
                    db.query(sql, (err, results) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                        } else {
                            res.render("control/all_customers", {
                                allCustomers: results[0],
                                freeCustomers: results[1],
                                search_message: ""
                            })
                        }
                    })
                    break;
                case "reservations":
                    sql = "SELECT reserve_no, fname, lname, R.customer_id, car_id, startD, endD,rented FROM reservations AS R JOIN customers AS C ON R.customer_id=C.customer_id";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                        } else {
                            res.render("control/reservations", {
                                reservations: result,
                                search_message: "",
                            })
                        }
                    })
                    break;
                case "setting":
                    sql = "SELECT * FROM admins;";
                    db.query(sql, (err, result1) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                        } else {
                            sql = "SELECT * FROM offices";
                            db.query(sql, (err, result2) => {
                                if (err) {
                                    console.log(err)
                                    display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                                } else {
                                    res.render("control/setting", {
                                        admins: result1,
                                        offices: result2,
                                        startDate: new Date().toJSON().slice(0, 10)
                                    })
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
                            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                        } else {
                            res.render("control/add_car", {
                                offices: result,
                                error_msg1: "",
                                error_msg2: ""
                            })
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
                    let currentDate = new Date().toJSON().slice(0, 10)
                    let maxDate = new Date()
                    maxDate.setFullYear(maxDate.getFullYear() + 1)
                    maxDate = maxDate.toJSON().slice(0, 10)
                    sql = "SELECT * FROM cars; SELECT * from customers";
                    db.query(sql, (err, results) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                        } else {
                            res.render("control/admin_reserve", {
                                cars: results[0],
                                customers: results[1],
                                minDate: currentDate,
                                maxDate: maxDate
                            })
                        }
                    })
                    break;
                case "add_schedule":
                    // let currentDate = new Date().toJSON().slice(0, 10)
                    // let maxDate = new Date()
                    // maxDate.setFullYear(maxDate.getFullYear() + 1)
                    // maxDate = maxDate.toJSON().slice(0, 10)
                    sql = "SELECT * FROM cars;";
                    db.query(sql, (err, result) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                        } else {
                            //console.log(result)
                            res.render("control/add_schedule", {
                                cars: result,
                                // minDate: currentDate,
                                // maxDate: maxDate
                            })
                        }
                    })
                    break;
            }
        } else {
            res.redirect("control")
        }
    });


app.route("/add")
    .get(function (req, res) {
        res.redirect("control")
    })
    .post(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
            let sql = ""
            let VALUES
            let dates
            switch (req.body.control_btn) {
                case "add_car":
                    const { image } = req.files
                    //console.log(image.data)
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
                            display_failure(res, "ERROR! New car can not be added!", err.sqlMessage, "")
                        } else {
                            console.log("NEW car added to the system!")
                            console.log(VALUES)
                            loadOneImage(req.body.lic_no)
                            //res.redirect("/admin")
                            display_success(res, "New Car was added successfully!", "", "")
                        }
                    })
                    break;

                case "add_customer":
                    VALUES = [
                        null
                        , req.body.fname
                        , req.body.lname
                        , req.body.nationalID
                        , req.body.email
                        , md5(req.body.password + process.env.SALT)
                        , req.body.address
                        , req.body.phone
                    ]
                    sql = "INSERT INTO customers VALUES (?)";
                    db.query(sql, [VALUES], (err, result) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! New customer can not be added!", err.sqlMessage, "")
                        } else {
                            console.log("NEW customer added to the system!")
                            console.log(VALUES)
                            display_success(res, "New Customer was added successfully!", "", "")
                        }
                    })
                    break;

                case "add_admin":
                    VALUES = [
                        req.body.email
                        , md5(req.body.password + process.env.SALT)
                    ]
                    sql = "INSERT INTO admins (email,password) VALUES (?)";
                    db.query(sql, [VALUES], (err, result) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! new Admin can not be added !", err.sqlMessage, "")
                        } else {
                            console.log("NEW admin added to the system!")
                            console.log(VALUES)
                            display_success(res, "New Admin was added successfully!", "", "")
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
                            display_failure(res, "ERROR! new office can not be added !", err.sqlMessage, "")
                        } else {
                            console.log("NEW office added to the system!")
                            console.log(VALUES)
                            display_success(res, "New Office was added successfully!", "", "")
                        }
                    })
                    break;

                case "add_res":
                    dates = make_date(req.body.sdate, req.body.edate)
                    if (dates.valid) {
                        const VALUE = [
                            req.body.car_id.split('-')[0],
                            dates.startD,
                            dates.endD,
                            dates.startD,
                            dates.endD,
                            req.body.car_id.split('-')[0],
                            dates.startD,
                            dates.endD,
                            dates.startD,
                            dates.endD
                        ]
                        let sql = "SELECT reserve_no,startD,endD FROM reservations AS R  JOIN cars AS C ON R.car_id=C.car_id WHERE R.car_id= ? AND (( ? BETWEEN R.startD AND R.endD OR ? BETWEEN R.startD AND R.endD) OR R.startD BETWEEN ? AND ?)";
                        sql += " UNION "
                        sql += "SELECT serv_no,startD,endD FROM service_sche AS SS  JOIN cars AS C ON SS.car_id=C.car_id WHERE SS.car_id= ? AND (( ? BETWEEN SS.startD AND SS.endD OR ? BETWEEN SS.startD AND SS.endD) OR SS.startD BETWEEN ? AND ?)";
                        db.query(sql, VALUE, (err, result) => {
                            if (err) {
                                console.log(err)
                                display_failure(res, "ERROR! can not search for this car now !", err.sqlMessage, "")
                            } else {
                                if (result.length) {
                                    console.log("car is not available in these dates")
                                    //res.status(204).send()
                                    display_failure(res, "ERROR! can not reserve this car !", "Selected dates is not available for this car", "")
                                } else {
                                    let time = dates.endD.getTime() - dates.startD.getTime() + 60000;
                                    let days = Math.ceil(time / (1000 * 3600 * 24));

                                    VALUES = [
                                        req.body.customer_id
                                        , req.body.car_id.split('-')[0]
                                        , dates.startD
                                        , dates.endD
                                        , days * req.body.car_id.split('-')[1]
                                        , req.body.rented
                                    ]
                                    sql = "INSERT INTO reservations(customer_id, car_id, startD, endD, cost, rented) VALUES (?)";
                                    db.query(sql, [VALUES], (err, result) => {
                                        if (err) {
                                            console.log(err)
                                            display_failure(res, "ERROR! can not reserve this car now try again later !", err.sqlMessage, "")
                                        } else {
                                            console.log("NEW reservation is made!")
                                            console.log(VALUES)
                                            display_success(res, "New Reservation was added successfully!", "", "")
                                        }
                                    })
                                }
                            }
                        })
                    }
                    else {
                        console.log("dates are not valid!")
                        // res.status(204).send()
                        display_failure(res, "ERROR! can not make the reservation !", "Selected dates are not valid", "")
                    }
                    break;

                case "add_schedule":
                    dates = make_date(req.body.sdate, req.body.edate)
                    if (dates.valid) {
                        const VALUE = [
                            req.body.car_id,
                            dates.startD,
                            dates.endD,
                            dates.startD,
                            dates.endD,
                            req.body.car_id,
                            dates.startD,
                            dates.endD,
                            dates.startD,
                            dates.endD
                        ]
                        let sql = "SELECT reserve_no,startD,endD FROM reservations AS R  JOIN cars AS C ON R.car_id=C.car_id WHERE R.car_id= ? AND (( ? BETWEEN R.startD AND R.endD OR ? BETWEEN R.startD AND R.endD) OR R.startD BETWEEN ? AND ?)";
                        sql += " UNION "
                        sql += "SELECT serv_no,startD,endD FROM service_sche AS SS  JOIN cars AS C ON SS.car_id=C.car_id WHERE SS.car_id= ? AND (( ? BETWEEN SS.startD AND SS.endD OR ? BETWEEN SS.startD AND SS.endD) OR SS.startD BETWEEN ? AND ?)";
                        db.query(sql, VALUE, (err, result) => {
                            if (err) {
                                console.log(err)
                                display_failure(res, "ERROR! can not search for this car now !", err.sqlMessage, "")
                            } else {
                                if (result.length) {
                                    console.log("car is busy in these dates")

                                    //res.status(204).send()
                                    display_failure(res, "ERROR! can not service this car !", "Selected dates is not available for this car", "")
                                } else {
                                    VALUES = [
                                        req.body.car_id.split('-')[0]
                                        ,req.body.car_id.split('-')[1]
                                        , dates.startD
                                        , dates.endD
                                    ]
                                    console.log("GGGGGG ",VALUES)
                                    sql = "INSERT INTO service_sche(car_id, office_id, startD, endD) VALUES (?)";
                                    db.query(sql, [VALUES], (err, result) => {
                                        if (err) {
                                            console.log(err)
                                            display_failure(res, "ERROR! can not service this car now try again later !", err.sqlMessage, "")
                                        } else {
                                            console.log("NEW service is made!")
                                            console.log(VALUES)
                                            display_success(res, "New service was added successfully!", "", "")
                                        }
                                    })
                                }
                            }
                        })
                    }
                    else {
                        console.log("dates are not valid!")
                        // res.status(204).send()
                        display_failure(res, "ERROR! can not make the reservation !", "Selected dates are not valid", "")
                    }
                    break;
            }

        } else {
            res.redirect("control")
        }
    });


app.route("/change")
    .post(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
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
                                    display_failure(res, "ERROR! Something bad happened!", err.sqlMessage, "")
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
                                    display_failure(res, "ERROR! Something bad happened!", err.sqlMessage, "")
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
        } else {
            res.redirect("control")
        }
    })


app.route("/confirmed")
    .post(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
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
                            display_failure(res, "ERROR! Can not edit this car now try again later!", err.sqlMessage, "")
                        } else {
                            console.log("car with licence No.:", req.body.lic_no, " has been modified!")
                            console.log(VALUES)
                            loadOneImage(req.body.lic_no)
                            display_success(res, "Car was updated successfully!", "", "")
                        }
                    })
                    break;
                case "edit_customer":
                    VALUES = [
                        req.body.fname
                        , req.body.lname
                        , req.body.nationalID
                        , req.body.email

                        , req.body.address
                        , req.body.phone
                        , req.body.customer_id
                    ]

                    sql = "UPDATE customers SET fname=?, lname=?, national_ID=?, email=?, `address`=?, phone=? WHERE customer_id=?";
                    db.query(sql, VALUES, (err, result) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! Can not update this customer information now try again later!", err.sqlMessage, "")
                        } else {
                            console.log("customer information has been modified!")
                            console.log(VALUES)
                            display_success(res, "Customer information was updated successfully!", "", "")
                        }
                    })
                    break;
            }
            //res.redirect("/admin")
        } else {
            res.redirect("control")
        }
    })


app.route("/search")
    .post(function (req, res) {
        app_session = req.session
        if (app_session.adminPermission) {
            let ac_VALUES = []
            let fmessage = ""
            let rec_VALUES
            let sql = ""

            switch (req.body.search_btn) {

                case "search_cars":

                    rec_VALUES = {
                        id: req.body.search_car_id,
                        office: parseInt(req.body.search_car_office),
                        company: req.body.search_car_company,
                        status: req.body.search_car_status,
                        model: req.body.search_car_model,
                        year: req.body.search_car_year,
                        low_price: req.body.search_car_lprice,
                        high_price: req.body.search_car_hprice,
                        sdate: new Date(req.body.search_car_sdate).toJSON().slice(0, 10),
                        edate: req.body.search_car_edate
                    }

                    sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id "

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

                    if (rec_VALUES.id) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.car_id=?"
                        ac_VALUES.push(parseInt(rec_VALUES.id))
                    }

                    if (rec_VALUES.status) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.status=?"
                        ac_VALUES.push(rec_VALUES.status)
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

                    if (rec_VALUES.sdate) {
                        if (!ac_VALUES.length) {
                            sql += " WHERE "
                        } else {
                            sql += " AND"
                        }
                        sql += " C.car_id NOT IN (SELECT R.car_id FROM reservations AS R WHERE R.startD = ? OR ( ? BETWEEN R.startD AND R.endD)"
                        let startDate = rec_VALUES.sdate + " 10:00:00";
                        ac_VALUES.push(startDate)
                        ac_VALUES.push(startDate)
                    }

                    if (rec_VALUES.edate) {
                        sql += " OR R.endD = ? OR ( ? BETWEEN R.startD AND R.endD)"
                        let endDate = new Date(rec_VALUES.edate).toJSON().slice(0, 10) + " 09:00:00";
                        ac_VALUES.push(endDate)
                        ac_VALUES.push(endDate)
                    }


                    sql += ");"
                    sql += " SELECT * FROM offices;"
                    sql += "SELECT * FROM cars WHERE car_id NOT IN(SELECT DISTINCT car_id FROM reservations);";
                    sql += "SELECT * FROM service_sche"
                    // console.log("ac_VALUES: ", ac_VALUES)
                    // console.log(sql)
                    db.query(sql, ac_VALUES, (err, results) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! Search failed!", err.sqlMessage, "")
                        } else {
                            if (results[0].length === 0) {
                                fmessage = "No results"
                            }
                            else {
                                fmessage = ""
                            }
                            res.render("control/all_cars", {
                                allCars: results[0],
                                offices: results[1],
                                freeCars: results[2],
                                startDate: new Date().toJSON().slice(0, 10),
                                cars_search_message: fmessage,
                                scheduled_cars: results[3],
                                services_search_message: "",
                            })
                        }
                    })
                    break;

                case "search_customers":

                    rec_VALUES = {
                        id: req.body.search_customer_id,
                        fname: req.body.search_customer_fname,
                        lname: req.body.search_customer_lname,
                        email: req.body.search_customer_email,
                        address: req.body.search_customer_address,
                        phone: req.body.search_customer_phone,
                    }

                    sql = "SELECT * FROM customers AS C "

                    if (rec_VALUES.id) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.customer_id=?"
                        ac_VALUES.push(parseInt(rec_VALUES.id))
                    }

                    if (rec_VALUES.fname) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.fname=?"
                        ac_VALUES.push(rec_VALUES.fname)
                    }

                    if (rec_VALUES.lname) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.lname=?"
                        ac_VALUES.push(rec_VALUES.lname)
                    }

                    if (rec_VALUES.email) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.email = ?"
                        ac_VALUES.push(rec_VALUES.email)
                    }

                    if (rec_VALUES.address) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.address = ?"
                        ac_VALUES.push(rec_VALUES.address)
                    }

                    if (rec_VALUES.phone) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.phone = ?"
                        ac_VALUES.push(parseInt(rec_VALUES.phone))
                    }

                    sql += ";"
                    sql += "SELECT * FROM customers where customer_id NOT IN(SELECT DISTINCT customer_id FROM reservations)"
                    db.query(sql, ac_VALUES, (err, results) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! Search failed!", err.sqlMessage, "")
                        } else {
                            if (results[0].length === 0) {
                                fmessage = "No results"
                            }
                            else {
                                fmessage = ""
                            }
                            res.render("control/all_customers", {
                                allCustomers: results[0],
                                freeCustomers: results[1],
                                search_message: fmessage
                            })
                        }
                    })
                    break;

                case "search_reservations":
                    rec_VALUES = {
                        reservationID: req.body.search_res_resID,
                        customerID: req.body.search_res_customerID,
                        carID: req.body.search_res_carID,
                        fname: req.body.search_res_fname,
                        rented: req.body.search_res_rented,
                        sdate: req.body.search_res_sdate,
                        edate: req.body.search_res_edate

                    }

                    sql = "SELECT * FROM reservations AS R JOIN customers AS C ON R.customer_id=C.customer_id "


                    if (rec_VALUES.reservationID) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "R.reserve_no=?"
                        ac_VALUES.push(parseInt(rec_VALUES.reservationID))
                    }

                    if (rec_VALUES.customerID) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "R.customer_id=?"
                        ac_VALUES.push(parseInt(rec_VALUES.customerID))
                    }

                    if (rec_VALUES.carID) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "R.car_id=?"
                        ac_VALUES.push(parseInt(rec_VALUES.carID))
                    }

                    if (rec_VALUES.fname) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "C.fname=?"
                        ac_VALUES.push(rec_VALUES.fname)
                    }

                    if (rec_VALUES.rented) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "R.rented=?"
                        ac_VALUES.push(rec_VALUES.rented)
                    }

                    if (rec_VALUES.sdate) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "R.startD=?"
                        ac_VALUES.push(rec_VALUES.sdate + " 10:00:00")
                    }

                    if (rec_VALUES.edate) {
                        if (ac_VALUES.length) {
                            sql += " AND "
                        } else {
                            sql += " WHERE "
                        }
                        sql += "R.endD=?"
                        ac_VALUES.push(rec_VALUES.edate + " 09:00:00")
                    }


                    sql += ";"
                    console.log("ac_VALUES: ", ac_VALUES)
                    console.log(sql)
                    db.query(sql, ac_VALUES, (err, result) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! Search failed!", err.sqlMessage, "")
                        } else {
                            if (result.length === 0) {
                                fmessage = "No results"
                            }
                            else {
                                fmessage = ""
                            }
                            res.render("control/reservations", {
                                reservations: result,
                                search_message: fmessage
                            })

                        }
                    })
                    break;

                case "search_service_schedule":
                    let date = new Date(req.body.search_service_date)
                    const VALUES = [
                        date.toJSON().slice(0, 10) + " 10:00:00",
                    ]
                    sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id;";
                    sql += "SELECT * FROM offices;"
                    sql += "SELECT * FROM cars WHERE car_id NOT IN(SELECT DISTINCT car_id FROM reservations); ";
                    sql += "SELECT * FROM service_sche WHERE ? BETWEEN startD AND endD;"

                    db.query(sql, VALUES, (err, results) => {
                        if (err) {
                            console.log(err)
                            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                        } else {
                            let fmessage = ""
                            if (results[3].length === 0) {
                                fmessage = "No results"
                            }
                            res.render("control/all_cars", {
                                allCars: results[0],
                                offices: results[1],
                                freeCars: results[2],
                                startDate: new Date().toJSON().slice(0, 10),
                                cars_search_message: "",
                                scheduled_cars: results[3],
                                services_search_message: fmessage
                            })
                        }
                    })
                    break;

                case "daily_report":
                    load_dashBoard(app_session.admin_id, res, req.body.search_profit_sdate, req.body.search_profit_edate, "", "");
                    break;

                case "income_statemet":
                    load_dashBoard(app_session.admin_id, res, "", "", req.body.search_income_sdate, req.body.search_income_edate);
                    break;

                case "car_status":
                    load_dashBoard(app_session.admin_id, res, "", "", "", "", req.body.search_cStatus_date);
                    break;

            }
        } else {
            res.redirect("control")
        }
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
        const VALUES = [
            req.body.username,
            md5(req.body.password + process.env.SALT)
        ]
        sql = "SELECT * FROM `customers` WHERE email=? AND `password`=?";
        db.query(sql, VALUES, (err, result) => {
            if (err) {
                console.log(err)
                display_filure_user(res, "ERROR! sign in failed!", "Please try again later!", "", "")
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
            , req.body.nationalID
            , req.body.email
            , md5(req.body.password + process.env.SALT)
            , req.body.address
            , parseInt(req.body.phone)
        ]
        sql = "SELECT email FROM customers WHERE email=?";
        db.query(sql, req.body.email, (err, result) => {
            if (err) {
                console.log(err)
                display_filure_user(res, "ERROR! sign up failed!", "Please check your information", "", "")
            } else {
                if (result.length) {
                    console.log(err)
                    display_filure_user(res, "ERROR! can not sign up!", "This email already exist!", "", "")
                 }
                else {
                    sql = "INSERT INTO customers VALUES (?)";
                    db.query(sql, [VALUES], (err, result) => {
                        if (err) {
                            console.log(err)
                            display_filure_user(res, "ERROR! sign up failed!", "Please try again later!", "", "")
                        } else {
                            console.log(new Date().toLocaleString() + ":: NEW customer added to the system!")
                            console.log(VALUES)
                            res.redirect("/signin")
                        }
                    })
                }
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
        sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE status='Active'; SELECT * FROM offices";
        db.query(sql, (err, results) => {
            if (err) {
                console.log(err)
                display_filure_user(res, "ERROR! can not load the page now!", "Try again later", "", "")
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
    .get(function (req, res) {
        res.redirect("main")
    })
    .post(function (req, res) {

        let rec_VALUES = {
            office: parseInt(req.body.filter_office),
            company: req.body.filter_company,
            model: req.body.filter_model,
            year: req.body.filter_year,
            low_price: req.body.filter_lprice,
            high_price: req.body.filter_hprice,
            sdate: new Date(req.body.filter_sdate).toJSON().slice(0, 10),
            edate: req.body.filter_edate
        }
        let ac_VALUES = []
        let fmessage = ""

        let sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE status='Active' "

        if (rec_VALUES.office) {
            if (rec_VALUES.office === 0) {
                sql += "AND C.office_id "
            } else {
                sql += "AND C.office_id=? "
                ac_VALUES.push(rec_VALUES.office)
            }
        }
        if (rec_VALUES.company) {
            sql += "AND C.company=? "
            ac_VALUES.push(rec_VALUES.company)
        }
        if (rec_VALUES.model) {
            sql += "AND C.model=? "
            ac_VALUES.push(rec_VALUES.model)
        }
        if (rec_VALUES.year) {
            sql += "AND C.year=? "
            ac_VALUES.push(rec_VALUES.year)
        }
        if (rec_VALUES.lic_no) {
            sql += "AND C.lic_no=? "
            ac_VALUES.push(rec_VALUES.lic_no)
        }
        if (rec_VALUES.low_price) {
            sql += "AND C.price >= ? "
            ac_VALUES.push(parseInt(rec_VALUES.low_price))
        }
        if (rec_VALUES.high_price) {
            sql += "AND C.price <= ? "
            ac_VALUES.push(parseInt(rec_VALUES.high_price))
        }
        if (rec_VALUES.sdate) {
            sql += "AND C.car_id NOT IN (SELECT R.car_id FROM reservations AS R WHERE R.startD = ? OR ( ? BETWEEN R.startD AND R.endD)"
            let startDate = rec_VALUES.sdate + " 10:00:00";
            ac_VALUES.push(startDate)
            ac_VALUES.push(startDate)
        }

        if (rec_VALUES.edate) {
            sql += " OR R.endD = ? OR ( ? BETWEEN R.startD AND R.endD)"
            let endDate = new Date(rec_VALUES.edate).toJSON().slice(0, 10) + " 09:00:00";
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
                display_filure_user(res, "ERROR! can not search now!", "Try again later", "", "")
            } else {
                if (results[0].length === 0) {
                    fmessage = "No results"
                }

                if (app_session.userPermission) {
                    res.render("main", {
                        cars: results[0],
                        hideClass: "",
                        user: app_session.user_name,
                        filters_message: fmessage,
                        offices: results[1],
                        startDate: new Date().toJSON().slice(0, 10)
                    })
                }
                else {
                    res.render("main", {
                        cars: results[0],
                        hideClass: "hide-logout",
                        user: "Guest",
                        filters_message: fmessage,
                        offices: results[1],
                        startDate: new Date().toJSON().slice(0, 10)
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
                display_filure_user(res, "ERROR! can not view this car now!", "Try again later", "", "")
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
            let sql = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE C.car_id= ?;";
            sql += "SELECT startD, endD FROM reservations WHERE car_id=?"
            sql += " UNION "
            sql += "SELECT startD, endD FROM service_sche WHERE car_id=? ORDER BY startD"
            db.query(sql, [VALUE, VALUE, VALUE], (err, results) => {
                if (err) {
                    console.log(err)
                    display_filure_user(res, "ERROR! can not reserve this car now!", "Try again later", "", "")
                } else {
                    let maxDate = new Date()
                    maxDate.setFullYear(maxDate.getFullYear() + 1)
                    maxDate = maxDate.toJSON().slice(0, 10)
                    res.render("cars/reserve", {
                        car: results[0][0],
                        reservations: results[1],
                        minDate: new Date().toJSON().slice(0, 10),
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
            let dates = make_date(req.body.sdate, req.body.edate)

            if (dates.valid) {
                const VALUE = [
                    req.body.car_id,
                    dates.startD,
                    dates.endD,
                    dates.startD,
                    dates.endD
                ]
                let sql = "SELECT reserve_no,startD,endD FROM reservations AS R  JOIN cars AS C ON R.car_id=C.car_id WHERE R.car_id= ? AND (( ? BETWEEN R.startD AND R.endD OR ? BETWEEN R.startD AND R.endD) OR R.startD BETWEEN ? AND ?)";
                db.query(sql, VALUE, (err, result) => {
                    if (err) {
                        console.log(err)
                        display_filure_user(res, "ERROR! can not reserve this car now!", "Try again later", "", "")
                    } else {
                        if (result.length) {
                            for (let i = 0; i < result.length; i++) {
                                console.log("car can not be reserved:")
                                console.log("res no.:", result[i].reserve_no)
                                console.log("Start date: ", result[i].startD.toLocaleString())
                                console.log("End date: ", result[i].endD.toLocaleString())
                            }
                            display_filure_user(res, "ERROR! can not reserve this car!", "These dates are not available", "", "")
                            //res.status(204).send()
                        } else {

                            let time = dates.endD.getTime() - dates.startD.getTime() + 60000;
                            let days = Math.ceil(time / (1000 * 3600 * 24));

                            const VALUE = [
                                app_session.user_id,
                                parseInt(req.body.car_id),
                                dates.startD,
                                dates.endD,
                                days * req.body.car_price
                            ]
                            let sql1 = "INSERT INTO reservations(customer_id, car_id, startD, endD, cost ) VALUES (?);";
                            let sql2 = "SELECT * FROM cars AS C JOIN offices AS O ON C.office_id=O.office_id WHERE C.car_id= ?;"
                            let sql3 = "SELECT reserve_no, DATEDIFF(endD, startD) AS days, (DATEDIFF(endD, startD) * C.price) AS cost FROM reservations AS R JOIN cars AS C ON R.car_id=C.car_id WHERE R.customer_id= ? AND R.car_id= ? AND R.startD= ? AND R.endD= ?;";
                            let sql = sql1 + sql2 + sql3
                            db.query(sql, [VALUE, VALUE[1], VALUE[0], VALUE[1], VALUE[2], VALUE[3], VALUE[4]], (err, results) => {
                                if (err) {
                                    console.log(err)
                                    display_filure_user(res, "ERROR! can not reserve this car now!", "Try again later", "", "")
                                } else {
                                    console.log(new Date().toLocaleString() + ":: reservation made by user ID:" + app_session.user_id + " car ID:" + req.body.car_id)
                                    res.render("cars/payments", {
                                        customer: app_session.user_id,
                                        car: results[1][0],
                                        payment: results[2][0],
                                        sdate: dates.startD,
                                        edate: dates.endD
                                    })
                                }
                            })
                        }
                    }
                })
            } else {
                display_filure_user(res, "ERROR! can not reserve this car now!", "Dates not valid!", "", "")
                //res.status(204).send()
            }
        }
        else {
            res.redirect("signin")
        }
    });


app.route("/payments")
    .get(function (req, res) {
        res.redirect("main")
    })
    .post(function (req, res) {
        app_session = req.session
        if (app_session.userPermission) {

            let pay = "No"
            let res_no

            if (req.body.yes_pay_btn) {
                console.log("Customer with id:" + app_session.user_id + " just paid !")
                pay = "Yes"
                res_no = req.body.yes_pay_btn
            }
            else if (req.body.no_pay_btn) {
                console.log("Customer with id:" + app_session.user_id + " did not pay !")
                pay = "No"
                res_no = req.body.no_pay_btn
            }

            const VALUE = [
                pay,
                res_no
            ]

            let sql = "UPDATE reservations SET rented = ? WHERE reserve_no=?";
            db.query(sql, [VALUE[0], VALUE[1]], (err, results) => {
                if (err) {
                    console.log(err)
                    display_filure_user(res, "ERROR! can not pay now!", "Try again later", "", "")
                } else {
                    console.log(new Date().toLocaleString() + ":payments status for user with ID:" + app_session.user_id + " has been saved!")
                    res.redirect("profile")
                }
            })
        }
    })


//? ---------------------------------------------< End of Main route section >-------------------------------------------------------

//? ---------------------------------------------< Profile route section >-------------------------------------------------------
app.route("/profile")
    .get(function (req, res) {
        app_session = req.session
        if (app_session.userPermission) {
            const VALUE = [app_session.user_id, app_session.user_id]

            sql = "SELECT * FROM customers WHERE customer_id=?; SELECT *, DATEDIFF(endD, startD) AS days, (DATEDIFF(endD, startD) * C.price) AS cost FROM reservations AS R JOIN cars AS C ON R.car_id=C.car_id  WHERE R.customer_id= ?";
            db.query(sql, VALUE, (err, results) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(results)
                    res.render("profile", {
                        user: results[0][0],
                        userRes: results[1]
                    })
                }
            })
        }
        else {
            res.redirect("signin")
        }
    })
    .post(function (req, res) {
        if (req.body.cancel_btn) {
            sql = "SELECT startD FROM reservations WHERE reserve_no = ?";
            const VALUE = req.body.cancel_btn

            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                    display_filure_user(res, "ERROR! can not cancel this car now!", "Try again later", "", "")
                } else {
                    console.log(result[0].startD)
                    let currentDate = new Date()
                    let startDate = new Date(result[0].startD);
                    if (Date.parse(startDate) < Date.parse(currentDate)) {
                        console.log("you can not delete this reservation!")
                        display_filure_user(res, "ERROR! can not cancel this car now!", "Rent period started!", "contact the admin", "")
                        //res.status(204).send()
                    } else {
                        sql = "DELETE FROM reservations WHERE reserve_no = ?";
                        const VALUE = req.body.cancel_btn
                        db.query(sql, VALUE, (err, result) => {
                            if (err) {
                                console.log(err)
                                display_filure_user(res, "ERROR! can not delete this car now!", "Try again later", "", "")
                            } else {
                                console.log("A user canceled a reservation!")
                                res.redirect("profile")
                            }
                        })
                    }
                }
            })
        }
        if (req.body.pay_now_btn) {

            sql = "UPDATE reservations SET rented='Yes' WHERE reserve_no=? ";
            const VALUE = req.body.pay_now_btn
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                    display_filure_user(res, "ERROR! can not pay now!", "Try again later", "", "")
                } else {
                    console.log("A user paid reservation no " + VALUE + "!")
                    res.redirect("profile")
                }
            })
        }
    })
//? ---------------------------------------------< End of profile route section >-------------------------------------------------------



//? ---------------------------------------------< 404 route section >-------------------------------------------------------
app.get('*', function (req, res) {
    res.status(404).send('404 Not Found');
});
//? ---------------------------------------------< End of 404 route section >------------------------------------------------


//? ---------------------------------------------< all functions >-------------------------------------------------------
function display_success_user(res, msg1, msg2, msg3) {
    res.render("success", {
        messge1: msg1
        , messge2: msg2
        , messge3: msg3
    })
}

function display_filure_user(res, msg1, msg2, msg3) {
    res.render("failure", {
        messge1: msg1
        , messge2: msg2
        , messge3: msg3
    })
}




function display_failure(res, msg1, msg2, msg3) {
    res.render("control/failure", {
        message1: msg1,
        message2: msg2,
        message3: msg3
    })
}

function display_success(res, msg1, msg2, msg3) {
    res.render("control/success", {
        message1: msg1,
        message2: msg2,
        message3: msg3
    })
}


//used when admin login
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
                    if (err){ 
                        console.log(err);
                        display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                    }
                    else {
                        //console.log("Image " + imageName + ".jpg successfully loaded!");
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
            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
        } else {
            let imageName = result[0].car_id
            let buffer = Buffer.from(result[0].image, 'binary');
            fs.writeFile('public\\images\\cars\\' + imageName + '.jpg', buffer, function (err, written) {
                if (err) {
                    console.log(err)
                    display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
                }
                else {
                   // console.log("Image " + imageName + ".jpg successfully loaded!");
                }
            });
        }
    })
}


function load_dashBoard(admin, res, sDate, eDate, sDate_incomeS, eDate_incomeS, status_date) {

    let startDate
    let endDate

    let startDateIncome
    let endDateIncome

    let carStatusDate

    if (sDate) {
        startDate = sDate
    }
    else {
        startDate = new Date().toJSON().slice(0, 10)
    }

    if (eDate) {
        endDate = eDate
    }
    else {
        endDate = new Date()
        endDate.setDate(endDate.getDate() + 5);
        endDate = endDate.toJSON().slice(0, 10) + " 9:00:00"
    }

    if (sDate_incomeS) {
        startDateIncome = sDate_incomeS
    } else {
        startDateIncome = new Date()
        startDateIncome.setDate(startDateIncome.getDate() - 5);
        startDateIncome = startDateIncome.toJSON().slice(0, 10)
    }

    if (eDate_incomeS) {
        endDateIncome = eDate_incomeS
    } else {

        endDateIncome = new Date()
        endDateIncome.setDate(endDateIncome.getDate() + 5);
        endDateIncome = endDateIncome.toJSON().slice(0, 10)
    }

    if (status_date) {
        carStatusDate = new Date(status_date)
        carStatusDate = carStatusDate.toJSON().slice(0, 10) + " 10:00:00"
    }
    else {
        carStatusDate = new Date()
        carStatusDate = carStatusDate.toJSON().slice(0, 10) + " 10:00:00"
    }


    let sql1 = "SELECT C.car_id, company, model, `year`, price, O.location, image, COUNT(*) AS num_res FROM cars AS C\
    JOIN offices AS O ON C.office_id=O.office_id \
    JOIN reservations AS R ON C.car_id=R.car_id\
    GROUP BY C.car_id limit 12;"
    let sql2 = "SELECT COUNT(car_id) AS count FROM cars;"
    let sql3 = "SELECT COUNT(customer_id) AS count FROM customers;"
    let sql4 = "SELECT COUNT(reserve_no) AS count FROM reservations;"
    let sql5 = "SELECT SUM(DATEDIFF(endD, startD) * C.price) AS total_profits FROM reservations AS R JOIN cars AS C ON R.car_id=C.car_id;"
    let sql6 = "SELECT reserve_no, fname, lname, car_id, startD, endD,res_date FROM reservations AS R JOIN customers AS C ON R.customer_id=C.customer_id ORDER BY  res_date DESC  limit 10;"
    let sql7 = "SET @from = ?;\
    SET @to = ?;\
    WITH dates AS\
    (   \
        SELECT @from + INTERVAL seq DAY + INTERVAL 10 HOUR AS `days`\
        FROM seq_0_to_99999999\
        WHERE seq BETWEEN 0 and (SELECT TIMESTAMPDIFF(DAY, @from, @to))\
    )\
    SELECT days, IFNULL(SUM(C.price),0) AS total_profit, COUNT(C.car_id) AS cars_num FROM reservations AS R\
    JOIN cars AS C ON R.car_id=C.car_id \
    RIGHT JOIN dates ON (days BETWEEN R.startD AND R.endD)\
    GROUP BY days\
    ORDER BY days\
    ;";
    let sql8 = "SELECT DATE(res_date)AS resDate, COUNT(res_date)AS num_res, SUM(cost)AS income FROM reservations WHERE res_date BETWEEN ? AND ? GROUP BY DATE(res_date);";
    let sql9 = "SET @dat = ?;\
    SET @status1= 'Available';\
    SET @status2= 'Rented';\
    SET @status3= 'Out of Service';\
    SELECT SS.car_id, C.company, C.model, C.year,  @status3 AS `status` from service_sche AS SS JOIN cars AS C ON SS.car_id=C.car_id WHERE @dat BETWEEN startD AND endD\
    UNION\
    SELECT R.car_id, C.company, C.model, C.year, @status2 from reservations AS R JOIN cars AS C ON R.car_id=C.car_id  WHERE @dat BETWEEN startD AND endD\
    UNION\
    SELECT C.car_id, C.company, C.model, C.year, @status1 from cars AS C \
    WHERE C.car_id NOT IN (\
        SELECT SS.car_id from service_sche AS SS WHERE @dat BETWEEN startD AND endD\
    UNION\
    SELECT R.car_id from reservations AS R WHERE @dat BETWEEN startD AND endD\
    )\
    ORDER BY car_id;"
    const VALUES = [
        startDate
        , endDate
        , startDateIncome
        , endDateIncome
        , carStatusDate
    ]
    let sql = sql1 + sql2 + sql3 + sql4 + sql5 + sql6 + sql7 + sql8 + sql9
    db.query(sql, VALUES, (err, results) => {
        if (err) {
            console.log(err)
            display_failure(res, "ERROR! failed to load data!", "Database failed!", err.sqlMessage)
        } else {
            res.render("control/dashboard", {
                admin: admin
                , cars: results[0]
                , cars_count: results[1][0].count
                , customers_count: results[2][0].count
                , res_count: results[3][0].count
                , total_profits: results[4][0].total_profits
                , recent_res: results[5]
                , search_message: ""
                , profitsReport: results[8]
                , incomeTable: results[9]
                , carStatus: results[14]
            })
        }
    })
}


function delete_entry(btn_value, data_index) {
    let sql = ""
    const VALUE = data_index

    switch (btn_value) {
        // to delete a car
        case "delete_car":
            sql = "DELETE FROM cars WHERE lic_no = ?";
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                    display_failure(res, "ERROR! failed to load data!", "Delete failed!", err.sqlMessage)
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
                    display_failure(res, "ERROR! failed to load data!", "Delete failed!", err.sqlMessage)
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
                    display_failure(res, "ERROR! failed to load data!", "Delete failed!", err.sqlMessage)
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
                    display_failure(res, "ERROR! failed to load data!", "Delete failed!", err.sqlMessage)
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
                    display_failure(res, "ERROR! failed to load data!", "Delete failed!", err.sqlMessage)
                } else {
                    console.log("An admin deleted a reservation from the system!")
                }
            })
            break;
        case "delete_schedule":
            sql = "DELETE FROM service_sche WHERE serv_no = ?";
            db.query(sql, VALUE, (err, result) => {
                if (err) {
                    console.log(err)
                    display_failure(res, "ERROR! failed to load data!", "Delete failed!", err.sqlMessage)
                } else {
                    console.log("An admin deleted a service from the system!")
                }
            })
            break;
    }
    return;
}


function make_date(sDate, eDate) {

    let startDate = new Date(sDate);
    let endDate = new Date(eDate);
    startDate.setHours(10, 0, 0)
    endDate.setHours(9, 0, 0)

    let start = Date.parse(startDate);
    let end = Date.parse(endDate);

    let response = {
        valid: false,
        startD: startDate,
        endD: endDate
    }

    if (start === end || end < start) {
        response.valid = false
    } else {
        response.valid = true
    }
    return response;
}

//? ---------------------------------------------< ------------- >-------------------------------------------------------

app.listen(process.env.PORT || 3000, function () {
    console.log(new Date().toLocaleString() + ":: Server started..")
})
