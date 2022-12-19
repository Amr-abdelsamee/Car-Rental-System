CREATE DATABASE car_rental;
USE car_rental;
CREATE TABLE cars(
    car_id int auto_increment PRIMARY KEY,
    company varchar(127) not null,
    model varchar(127) not null,
    lic_no varchar(11) not null UNIQUE,
    color varchar(127) not null,
    `status` varchar(127) not null,
    `year` int not null,
    miles float not null,
    price int not null,
    office_id int not null,
    `image` MEDIUMBLOB
);
CREATE TABLE customers(
    customer_id int auto_increment PRIMARY KEY, 
    fname varchar(255) not null,
    lname varchar(255) not null,
    email varchar(255) not null UNIQUE ,
    `password` varchar(255) not null,
    `address` varchar(255) not null,
    phone int not null
);
CREATE TABLE reservations(
    reserve_no int auto_increment PRIMARY KEY, 
    customer_id int not null,
    car_id int not null,
    startD datetime not null,
    endD datetime not null,
    res_date datetime DEFAULT current_timestamp() not null,
);
CREATE TABLE admins(
    email varchar(255) not null PRIMARY KEY,
    `password` varchar(255) not null
);
CREATE TABLE offices(
    office_id int auto_increment not null PRIMARY KEY, 
    `location` varchar(50) not null UNIQUE 
);

ALTER TABLE reservations ADD FOREIGN KEY (car_id) 
REFERENCES cars(car_id);

ALTER TABLE reservations ADD FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id);

ALTER TABLE cars ADD FOREIGN KEY (office_id) 
REFERENCES offices(office_id);

