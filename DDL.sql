CREATE DATABASE car_rental;
USE car_rental;
CREATE TABLE cars(
    car_id int auto_increment PRIMARY KEY,
    company varchar(127) NOT NULL,
    model varchar(127) NOT NULL,
    lic_no varchar(11) NOT NULL UNIQUE,
    color varchar(127) NOT NULL,
    `status` enum('Active','Out of service') NOT NULL,
    `year` int NOT NULL,
    miles float NOT NULL,
    price int NOT NULL,
    office_id int NOT NULL,
    `image` MEDIUMBLOB
);
CREATE TABLE customers(
    customer_id int auto_increment PRIMARY KEY, 
    fname varchar(255) NOT NULL,
    lname varchar(255) NOT NULL,
    national_id int(20) NOT NULL UNIQUE,
    email varchar(255) NOT NULL UNIQUE ,
    `password` varchar(255) NOT NULL,
    `address` varchar(255) NOT NULL,
    phone int(12) NOT NULL
);
CREATE TABLE reservations(
    reserve_no int auto_increment PRIMARY KEY, 
    customer_id int NOT NULL,
    car_id int NOT NULL,
    startD datetime NOT NULL,
    endD datetime NOT NULL,
    res_date datetime DEFAULT current_timestamp() NOT NULL,
    cost INT(11) NOT NULL,
    `rented` ENUM('Yes','No') NOT NULL
);
CREATE TABLE service_sche(
    serv_no int auto_increment PRIMARY KEY, 
    car_id int NOT NULL,
    office_id int NOT NULL,
    startD datetime NOT NULL,
    endD datetime NOT NULL,
    serv_date datetime DEFAULT current_timestamp() NOT NULL,
);

CREATE TABLE admins(
    email varchar(255) NOT NULL PRIMARY KEY,
    `password` varchar(255) NOT NULL
);
CREATE TABLE offices(
    office_id int auto_increment NOT NULL PRIMARY KEY, 
    `location` varchar(50) NOT NULL UNIQUE 
);

ALTER TABLE reservations ADD FOREIGN KEY (car_id) 
REFERENCES cars(car_id);

ALTER TABLE reservations ADD FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id);

ALTER TABLE cars ADD FOREIGN KEY (office_id) 
REFERENCES offices(office_id);


ALTER TABLE service_sche ADD FOREIGN KEY (office_id) 
REFERENCES offices(office_id);

