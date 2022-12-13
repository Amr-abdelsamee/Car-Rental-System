USE car_rental;
INSERT INTO offices VALUES(NULL,'Alexandria');
INSERT INTO offices VALUES(NULL, 'Aswan');
INSERT INTO offices VALUES(NULL, 'Asyut');
INSERT INTO offices VALUES(NULL, 'Beheira');
INSERT INTO offices VALUES(NULL, 'Beni Suef');
INSERT INTO offices VALUES(NULL, 'Cairo');
INSERT INTO offices VALUES(NULL, 'Dakahlia');
INSERT INTO offices VALUES(NULL, 'Damietta');
INSERT INTO offices VALUES(NULL, 'Faiyum');
INSERT INTO offices VALUES(NULL, 'Gharbia');
INSERT INTO offices VALUES(NULL, 'Giza');
INSERT INTO offices VALUES(NULL, 'Ismailia');
INSERT INTO offices VALUES(NULL, 'Kafr el-Sheikh');
INSERT INTO offices VALUES(NULL, 'Matruh');
INSERT INTO offices VALUES(NULL, 'Minya');
INSERT INTO offices VALUES(NULL, 'Monufia');
INSERT INTO offices VALUES(NULL, 'New Valley');
INSERT INTO offices VALUES(NULL, 'North Sinai');
INSERT INTO offices VALUES(NULL, 'Port Said');
INSERT INTO offices VALUES(NULL, 'Qalyubia');
INSERT INTO offices VALUES(NULL, 'Qena');
INSERT INTO offices VALUES(NULL, 'Red Sea');
INSERT INTO offices VALUES(NULL, 'Al Sharqia');
INSERT INTO offices VALUES(NULL, 'Sohag');
INSERT INTO offices VALUES(NULL, 'South Sinai');
INSERT INTO offices VALUES(NULL, 'Suez');
INSERT INTO offices VALUES(NULL, 'Luxor');


INSERT INTO CARS(car_id, company, model, lic_no, color, `status`, `year`, miles, price, office_id, image_path)
        VALUES (NULL,"BMW",'320i','A3B3B6','BLACK','Active',2009,50000,30000,1,NULL);
INSERT INTO CARS(car_id, company, model, lic_no, color, `status`, `year`, miles, price, office_id, image_path) 
        VALUES (NULL,"OPEL",'INSIGNIA','A5656D','WHITE','Active',2019,50000,50000,1,NULL);
INSERT INTO CARS(car_id, company, model, lic_no, color, `status`, `year`, miles, price, office_id, image_path) 
VALUES (NULL,"OPEL",'astra','Adel56D','WHITE','Active',2019,10000,250000,1,NULL);


INSERT INTO CUSTOMERS (customer_id, fname, lname, email, `password`, `address`, phone) 
    VALUES(NULL,'adel','yasser','adel@','123','moh bek',01014066663);
INSERT INTO CUSTOMERS (customer_id, fname, lname, email, `password`, `address`, phone) 
    VALUES(NULL,'amr','abdelsamee','abso@','456','abu qir',01014022344);
INSERT INTO CUSTOMERS (customer_id, fname, lname, email, `password`, `address`, phone) 
    VALUES(NULL,'mohamed','saeed','saeed@','789','antoniadis park',01015998533);

INSERT INTO RESERVATIONS(reserve_no, customer_id, car_id, startD, endD) VALUES(NULL,1,1,'2022-10-20','2023-2-1');
INSERT INTO RESERVATIONS(reserve_no, customer_id, car_id, startD, endD) VALUES(NULL,2,3,'2022-12-5','2022-12-10');

INSERT INTO admins(email, `password`) VALUES ('admin','admin');
INSERT INTO admins(email, `password`) VALUES ('amr','1');
INSERT INTO admins(email, `password`) VALUES ('saeed','2');
INSERT INTO admins(email, `password`) VALUES ('adel','3');
INSERT INTO admins(email, `password`) VALUES ('kim','4');
INSERT INTO admins(email, `password`) VALUES ('slwa','5');
