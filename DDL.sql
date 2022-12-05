CREATE DATABASE car_rental;
USE car_rental;
CREATE TABLE cars(
    car_id int auto_increment PRIMARY KEY,
    company varchar(127) not null,
    color varchar(127) not null,
    status varchar(127) not null,
    office varchar(127) not null,
    model varchar(127) not null,
    year int not null,
    miles float not null,
    price int not null,
    lic_no varchar(11) not null UNIQUE,
    image_path MEDIUMBLOB
);
CREATE TABLE customers(
    customer_id int auto_increment PRIMARY KEY, 
    name varchar(255) not null,
    password varchar(255) not null,
    email varchar(255) not null,
    address varchar(255) not null,
    phone int not null
);
CREATE TABLE reservations(
    reserve_no int auto_increment PRIMARY KEY, 
    customer_id int,
    car_id int,
    startD DATE not NULL,
    endD DATE not NULL
);
CREATE TABLE admins(
    password varchar(255) not null,
    email varchar(255) not null PRIMARY KEY
);
ALTER TABLE reservations ADD FOREIGN KEY (car_id) 
REFERENCES cars(car_id);

ALTER TABLE reservations ADD FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id);

INSERT INTO admins(email, password) 
VALUES ('admin','admin');

