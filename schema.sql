CREATE DATABASE review;

use review;

CREATE TABLE products (
  id INT NOT NULL AUTO_INCREMENT,
  -- name varchar(40) not null,
  PRIMARY KEY (id)
);

CREATE TABLE reviewers (
  id INT NOT NULL AUTO_INCREMENT,
  name varchar(60) not null,
  email varchar(60) not null,
  PRIMARY KEY (id)
);

CREATE TABLE reviews (
  id INT NOT NULL AUTO_INCREMENT,
  product_id int not null,
  reviewer_id int not null,
  date DATETIME DEFAULT CURRENT_TIMESTAMP, -- on update current_timestamp
  rating bit(5) not null,
  summary TINYTEXT not null,
  body varchar(1000) not null,
  recommended bool not null,
  response varchar(1000),
  -- size bit(5) not null,
  -- width bit(5) not null,
  -- comfort bit(5) not null,
  -- quality bit(5) not null,
  -- item_length bit(5) not null,
  -- fit bit(5) not null,
  helpful mediumint not null,
  reported bool not null default 0,
  CHECK (LENGTH(body)>=50),
  PRIMARY key (id),
  foreign key (product_id) references products(id),
  foreign key (reviewer_id) references reviewers(id)
);

CREATE TABLE characteristics (
  id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  name varchar(16) not null
  PRIMARY KEY (id),
  foreign key (product_id) references products(id)
);

CREATE TABLE characteristics_reviews (
  id INT NOT NULL AUTO_INCREMENT,
  characteristic_id int not null,
  review_id int not null,
  value bit(5) not null,
  PRIMARY KEY (id),
  foreign key (characteristic_id) references characteristics(id),
  foreign key (review_id) references reviews(id)
);

CREATE TABLE photos (
  id INT NOT NULL AUTO_INCREMENT,
  review_id int not null,
  url varchar(255) not null,
  PRIMARY KEY (id),
  foreign key (review_id) references reviews(id)
);