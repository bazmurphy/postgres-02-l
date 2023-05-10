## Using Aggregate Functions

### Basic Aggregate Functions

How to calculate totals, averages, etc. over multiple rows.

You frequently need to get a single piece of information that is derived from multiple rows in a table. For example, when you need to know the total of all invoices for August 2018:

```sql
SELECT sum(total)
   FROM invoices
   WHERE invoice_date BETWEEN
         '2023-03-01' AND '2023-03-31';
```

```
   sum
---------
 8608.00
```

The aggregate functions are:

- `SUM()` : Calculate the total of the values in a column
- `AVG()` : Calculate the average (mean) of the values in a column
- `MIN() `: Determine the mimimum value of a column
- `MAX()` : Determine the maximum value of a column
- `COUNT()` : Count the number of values (non-null) in a column

All the above are in the SQL standard, most implementations provide others. SUM and AVG can only apply to numeric data, the others can apply to any datatype.

Further examples:

"What is the average length of stay at our hotel?" :

```sql
SELECT avg(checkout_date - checkin_date)
  FROM reservations;
```

```
        avg
--------------------
 3.2075471698113208
```

"What are the lowest and highest room rates we charge?" :

```sql
SELECT min(rate) AS lowest,
       max(rate) AS highest
  FROM rooms;
```

```
 lowest | highest
--------+---------
  85.00 |  123.00
```

You can use the count(x) function to count non-null values:

```sql
SELECT count(id) AS id_ct, count(postcode) AS post_ct
  FROM customers;
```

```
 id_ct | post_ct
-------+---------
   133 |     126
```

Notice that these two results show different values - there are NULL values for postcode but id is mandatory for all rows.

If you just want to count the number of rows, use `count(*)`. This is often used to find how many rows match a `WHERE` clause:

```sql
SELECT count(*)
  FROM customers
  WHERE country = 'Belgium';
```

```
 count
-------
     2
```

### Exercise 1

1.  Get the numbers of rows in each of the tables: rooms, room_types, customers and reservations.

```sql
SELECT count(*) FROM rooms;
```

```
 count
-------
    48
```

```sql
SELECT
  (SELECT count(*) FROM rooms) as rooms_rows,
  (SELECT count(*) FROM room_types) as room_types_rows,
  (SELECT count(*) FROM customers) as customers_rows,
  (SELECT count(*) FROM reservations) as reservations_rows;
```

```
 rooms_rows | room_types_rows | customers_rows | reservations_rows
------------+-----------------+----------------+-------------------
         48 |               5 |            133 |               106
```

2.  How many reservations do we have for next month?

```sql
SELECT COUNT(*)
FROM reservations
WHERE CAST(checkin_date AS text) LIKE '2023-05-%';
```

```
 count
-------
    30
```

```sql
SELECT COUNT(*)
FROM reservations
WHERE EXTRACT(MONTH FROM checkin_date) = EXTRACT(MONTH FROM CURRENT_DATE + 1)
AND EXTRACT(YEAR FROM checkin_date) = EXTRACT(YEAR FROM CURRENT_DATE);
```

```
 count
-------
    30
```

3.  How many invoices are still unpaid from over a month ago and what is the total owed?

```sql
SELECT COUNT(paid), SUM(total)
FROM invoices
WHERE paid = true;
```

```
 count |   sum
-------+----------
    56 | 18237.00
```

4.  What is the maximum gap in days between a customer booking a room and the checkin date for that booking?

```sql
SELECT MAX(checkin_date - booking_date)
FROM reservations;
```

```
 max
-----
  36
```

### Grouping Rows for Aggregation

You can calculate aggregates over subsets of rows using the GROUP BY clause:

```sql
SELECT count(*) FROM rooms
  GROUP BY room_type;
```

```
 count
-------
    14
    14
     8
    10
     2
```

What do you notice?

The query calculated the counts correctly but we have no idea which room type each value represents. To solve this we are allowed to include the GROUP BY expressions in the list of selected values, as below:

```sql
SELECT room_type, count(*) FROM rooms
  GROUP BY room_type;
```

```
 room_type    | count
--------------+-------
 PREMIUM      |    14
 PREMIER      |    14
 PREMIER PLUS |     8
 PREMIUM PLUS |    10
 FAMILY       |     2
```

Notice the `room_type` used for GROUP BY is also included in the SELECT list of values.

We can group by multiple expressions, for example:

```sql
SELECT trunc(room_no/100) AS floor,
       to_char(checkin_date, 'YYYY-MM') AS month,
       count(*),
       sum(no_guests),
       avg(no_guests)
  FROM reservations
  GROUP BY floor, month;
```

```
 floor |  month  | count | sum |          avg
-------+---------+-------+-----+------------------------
       | 2023-06 |    14 |  17 |     1.2142857142857143
     1 | 2023-04 |     3 |   5 |     1.6666666666666667
     4 | 2023-04 |     8 |  12 |     1.5000000000000000
     4 | 2023-03 |     7 |  10 |     1.4285714285714286
     2 | 2023-03 |    10 |  14 |     1.4000000000000000
     3 | 2023-04 |     8 |  12 |     1.5000000000000000
       | 2023-05 |    27 |  37 |     1.3703703703703704
     2 | 2023-04 |     8 |  14 |     1.7500000000000000
     2 | 2023-05 |     1 |   1 | 1.00000000000000000000
     1 | 2023-03 |    14 |  21 |     1.5000000000000000
     3 | 2023-05 |     2 |   3 |     1.5000000000000000
     3 | 2023-03 |     4 |   6 |     1.5000000000000000
```

Notice that the GROUP BY is using the column aliases `floor` and `month` that have been defined in the select list. This works in many, but not all, SQL implementations. (In those that don't allow aliases you must use the full expression, for example: `trunc(room_no/100)` instead of `floor`)

You can use a WHERE clause to restrict the rows that are included in the aggregate function. For example, if we need the above query for only the 2nd and 3rd floors:

```sql
SELECT trunc(room_no/100) AS floor,
       to_char(checkin_date, 'YYYY-MM') AS month,
       count(*),
       sum(no_guests),
       avg(no_guests)
  FROM reservations
  WHERE room_no BETWEEN 200 AND 399
  GROUP BY floor, month;
```

```
 floor |  month  | count | sum |          avg
-------+---------+-------+-----+------------------------
     2 | 2023-04 |     8 |  14 |     1.7500000000000000
     2 | 2023-03 |    10 |  14 |     1.4000000000000000
     3 | 2023-04 |     8 |  12 |     1.5000000000000000
     2 | 2023-05 |     1 |   1 | 1.00000000000000000000
     3 | 2023-05 |     2 |   3 |     1.5000000000000000
     3 | 2023-03 |     4 |   6 |     1.5000000000000000
```

Note that it is NOT usually possible to use column aliases in the where condition.

A WHERE clause is applied before any aggregation, if you need to restrict results using an aggregate function you can't do that using the WHERE clause.

In the above, to return only results with the number of reservations greater than, say, 4 we use the HAVING clause:

```sql
SELECT trunc(room_no/100) AS floor,
       to_char(checkin_date, 'YYYY-MM') AS month,
       count(*), sum(no_guests), avg(no_guests)
   FROM reservations
   GROUP BY floor, month
   HAVING count(*) > 4;    --<< Note the HAVING keyword
```

The order of clauses in the SELECT statement is:

```sql
SELECT ...
   FROM ...
   [WHERE ...]
   [GROUP BY ...
   [HAVING ...] ]
   [ORDER BY ...]
```

```
 floor |  month  | count | sum |        avg
-------+---------+-------+-----+--------------------
       | 2023-06 |    14 |  17 | 1.2142857142857143
     4 | 2023-04 |     8 |  12 | 1.5000000000000000
     4 | 2023-03 |     7 |  10 | 1.4285714285714286
     2 | 2023-03 |    10 |  14 | 1.4000000000000000
     3 | 2023-04 |     8 |  12 | 1.5000000000000000
       | 2023-05 |    27 |  37 | 1.3703703703703704
     2 | 2023-04 |     8 |  14 | 1.7500000000000000
     1 | 2023-03 |    14 |  21 | 1.5000000000000000
```

The square brackets indicate optional clauses. Note that HAVING is only relevant when you have a GROUP BY and must follow it in the SELECT statement.

It can be confusing at first knowing whether to use a WHERE clause or a HAVING clause with GROUP BY.

- Use the WHERE clause when values you want to test are available without having to use any aggregate functions (e.g. plain column values).

- Use HAVING when the values you want to test are the results of aggregate functions (e.g. `count(*)`, `sum(amount)`, `min(x)`, etc...).

---

### Exercise 2

1.  What is the grand total of all invoices for each month?

```sql
SELECT SUM(total) AS grand_total,
       to_char(invoice_date, 'Month YYYY') AS month
FROM invoices
GROUP by month;
```

```
 grand_total |     month
-------------+----------------
     9418.00 | April     2023
     8608.00 | March     2023
     1600.00 | May       2023
```

2.  How many guests could be accommodated at one time on each floor?

```sql
SELECT TRUNC(room_no/100) AS floor,
       SUM(no_guests) AS total_guests
FROM reservations
WHERE room_no IS NOT NULL
GROUP BY floor
ORDER BY floor;
```

```
 floor | total_guests
-------+--------------
     1 |           26
     2 |           29
     3 |           21
     4 |           22
```

3.  Which rooms have been occupied for less than 10 nights and for how many nights have they been occupied?

```sql
SELECT room_no, SUM(checkout_date - checkin_date) AS total_nights_occupied
FROM reservations
WHERE room_no IS NOT NULL
GROUP BY room_no
HAVING SUM(checkout_date - checkin_date) < 10
ORDER BY room_no;
```

```
 room_no | total_nights_occupied
---------+-----------------------
     101 |                     4
     102 |                     1
     103 |                     4
     104 |                     9
     106 |                     3
     107 |                     4
     108 |                     1
     109 |                     8
     110 |                     8
     112 |                     1
     201 |                     2
     202 |                     9
     203 |                     7
     204 |                     8
     208 |                     6
     209 |                     1
     210 |                     6
     212 |                     3
     301 |                     7
     302 |                     5
     303 |                     6
     304 |                     1
     305 |                     7
     306 |                     1
     309 |                     8
     311 |                     7
     312 |                     4
     401 |                     7
     402 |                     9
     404 |                     3
     405 |                     3
     408 |                     1
     409 |                     1
     410 |                     5
     411 |                     9
     412 |                     2

```

---

## Inserting, Updating and Deleting Rows

### Inserting data

To add new data to a table use the INSERT command that has the following format:

```sql
INSERT INTO table_name (column_name, ...)
       VALUES (value, ...)
```

For example:

```sql
INSERT INTO customers (name, email, address, city, postcode, country)
  VALUES ('John Smith','j.smith@johnsmith.org',
          '11 New Road','Liverpool','L10 2AB','UK');
```

```
 id  |    name    |         email         |     phone     |   address   |   city    | postcode | country
-----+------------+-----------------------+---------------+-------------+-----------+----------+---------
   1 | John Smith | j.smith@johnsmith.org | 0151 123 4567 | 11 New Road | Liverpool | L10 2AB  | UK
 134 | John Smith | j.smith@johnsmith.org |               | 11 New Road | Liverpool | L10 2AB  | UK
```

Note:

1. You do not need to supply the value for the automatically generated `id` column, it is populated from a sequence generator object.
2. The order of values in the `VALUES (...)` clause must correspond to the columns in the column name list. The first value is stored in the first named column, the second value in the second named column and so forth.

### Exercise 6

1. Insert yourself in the `customers` table. Query the table to check your new data.

```sql
INSERT INTO customers (name, email, phone, address, city, postcode, country)
VALUES ('Baz Murphy', 'bazmurphy@gmail.com', '0123 456 7890', '1 Old Road', 'London', 'EC1 1AB', 'UK');
```

```
 id  |    name    |        email        |     phone     |  address   |  city  | postcode | country
-----+------------+---------------------+---------------+------------+--------+----------+---------
 135 | Baz Murphy | bazmurphy@gmail.com | 0123 456 7890 | 1 Old Road | London | EC1 1AB  | UK
```

2. Insert a new room type of PENTHOUSE with a default rate of 185.00.

```sql
INSERT INTO room_types (room_type, def_rate)
VALUES ('PENTHOUSE', 185.00);
```

```
  room_type   | def_rate
--------------+----------
 FAMILY       |   123.00
 PREMIER      |   110.00
 PREMIER PLUS |   123.00
 PREMIUM      |    85.00
 PREMIUM PLUS |    98.00
 PENTHOUSE    |   185.00
```

---

### Updating Existing Data

When you need to change values in a table, use the `UPDATE` command. The general construction to update a row is:

```sql
UPDATE table
  SET column1 = value1,
      column2 = value2
  WHERE condition;
```

Note that `UPDATE` usually requires a `WHERE` clause to specify the row or rows to be updated. As with `SELECT`, if you don't specify a condition to restrict the rows, the command applies to all the rows in the table.

For example, to update the name and country of the customer with ID 3:

```sql
UPDATE customers
  SET name='Bob Marley',
      country='Jamaica'
  WHERE id=3;
```

```
 id |    name    |           email            |     phone     |   address   |    city    | postcode | country
----+------------+----------------------------+---------------+-------------+------------+----------+---------
  3 | Bob Marley | alice.evans001@hotmail.com | 0161 345 6789 | 3 High Road | Manchester | m13 4ef  | Jamaica
```

### Exercise 3

1.  Update the postcode of the customer named `Alice Evans` to `M21 8UP`

```sql
UPDATE customers
SET postcode = 'M21 8UP'
WHERE name = 'Alice Evans';
```

```
 id |    name     |           email            |     phone     |   address   |    city    | postcode | country
----+-------------+----------------------------+---------------+-------------+------------+----------+---------
  3 | Alice Evans | alice.evans001@hotmail.com | 0161 345 6789 | 3 High Road | Manchester | M21 8UP  | UK
```

2.  Update room 107 to allow up to 3 guests

```sql
UPDATE rooms
SET no_guests = 3
WHERE room_no = 107;
```

```
UPDATE rooms
SET no_guests = 3
WHERE room_no = 107;
```

3.  For the customer named `Nadia Sethuraman`, update her address to `2 Blue Street`, her city to `Glasgow` and her postcode to `G12 1AB` in one query

```sql
UPDATE customers
SET address = '2 Blue Street',
    city = 'Glasgow',
    postcode = 'G12 1AB'
WHERE name = 'Nadia Sethuraman';
```

```
 id |       name       |           email           | phone |    address    |  city   | postcode | country
----+------------------+---------------------------+-------+---------------+---------+----------+---------
  6 | Nadia Sethuraman | nadia.sethuraman@mail.com |       | 2 Blue Street | Glasgow | G12 1AB  | UK
```

4.  Update all the future bookings of customer with ID 96 to 3 nights (starting on the same check-in date) in one query

```sql
UPDATE reservations
SET checkout_date = checkin_date + INTERVAL '3 days'
WHERE cust_id = 96 AND checkin_date > CURRENT_DATE;
```

```
 id | cust_id | room_no | checkin_date | checkout_date | no_guests | booking_date
----+---------+---------+--------------+---------------+-----------+--------------
 74 |      96 |         | 2023-06-03   | 2023-06-06    |         1 | 2023-05-06
 80 |      96 |         | 2023-05-31   | 2023-06-03    |         1 | 2023-05-06
```

### Deleting a row

The syntax to delete a row is:

```sql
DELETE FROM table WHERE condition;
```

For example, to delete the booking with ID 4:

```sql
DELETE FROM reservations WHERE id=4;
```

**NOTE:** If you don't supply a `WHERE` clause with `DELETE` or `UPDATE` the command will be applied to **all** the rows in the table which is rarely what you want.

### Exercise 4

1.  Delete the bookings of customer ID `108` that do not have a room number assigned

```sql
DELETE FROM reservations
WHERE cust_id = 108 AND room_no IS NULL;
```

BEFORE

```
 id  | cust_id | room_no | checkin_date | checkout_date | no_guests | booking_date
-----+---------+---------+--------------+---------------+-----------+--------------
  28 |     108 |         | 2023-06-05   | 2023-06-08    |         1 | 2023-05-06
  85 |     108 |     405 | 2023-04-07   | 2023-04-08    |         2 | 2023-03-23
 105 |     108 |         | 2023-06-02   | 2023-06-04    |         1 | 2023-05-06
```

AFTER

```
 id | cust_id | room_no | checkin_date | checkout_date | no_guests | booking_date
----+---------+---------+--------------+---------------+-----------+--------------
 85 |     108 |     405 | 2023-04-07   | 2023-04-08    |         2 | 2023-03-23
```

2.  Delete all the bookings of customer Juri Yoshido (customer id 96)

```sql
DELETE FROM reservations
WHERE cust_id = 96
```

```sql
DELETE FROM reservations
WHERE cust_id IN (
  SELECT cust_id
  FROM reservations
  JOIN customers
  ON reservations.cust_id = customers.id
  WHERE customers.name = 'Juri Yoshido'
);
```

BEFORE

```
 id | cust_id | room_no | checkin_date | checkout_date | no_guests | booking_date
----+---------+---------+--------------+---------------+-----------+--------------
 74 |      96 |         | 2023-06-03   | 2023-06-06    |         1 | 2023-05-06
 80 |      96 |         | 2023-05-31   | 2023-06-03    |         1 | 2023-05-06

```

AFTER

```
 id | cust_id | room_no | checkin_date | checkout_date | no_guests | booking_date
----+---------+---------+--------------+---------------+-----------+--------------
(0 rows)
```

3.  Delete the customer details for Juri Yoshido

```sql
DELETE FROM customers
WHERE id = 96;
```

```sql
DELETE FROM customers
WHERE name = 'Juri Yoshido';
```

BEFORE

```
 id |     name     |         email         |   phone    |      address       |  city  | postcode | country
----+--------------+-----------------------+------------+--------------------+--------+----------+---------
 96 | Juri Yoshido | juri.yoshido@klqb.net | 6175559555 | 8616 Spinnaker Dr. | Boston | 51003    | USA

```

AFTER

```
 id | name | email | phone | address | city | postcode | country
----+------+-------+-------+---------+------+----------+---------
(0 rows)
```

---

## Joining tables

### Introduction

So far we've only looked at one table in any query. Many problems require data from several tables - how do we do that?

For example, if I want to phone or email customers who have not yet paid their invoices, which tables do I need to look at?

Use joins to combine data from more than one table. Joins use column values to match rows in one table to rows in another.

The join columns are usually referred to as foreign keys and primary keys.

![ER Diagram](er-diagram.png)

![Join Diagram](join-diagram.png)

### Foreign and Primary Keys

Each table should have a **Primary Key**. This is one or more columns whose values, which cannot be NULL, are combined to provide a unique identifying value for each row. Natural primary keys are often difficult to find so many tables use an arbitrary integer whose value is automatically generated when the row is created. When joining tables we need to match a single row to one or more other rows, usually in another table - for example, matching a customer to her/his reservations. The single row (customer) is usually identified by its primary key value.

**Foreign Keys** are the columns in a table that reference corresponding columns in another table (although self-referencing foreign keys can reference the same table). For example, the `res_id` column in the invoices table references the `id` column in the reservations table (see diagram above).

The referenced column is almost always the primary key of the referenced table because a foreign key must always reference exactly one row in the referenced table (primary keys guarantee that).

### Using JOIN in SQL

To join reservations and invoices in SQL:

```sql
SELECT r.cust_id, r.room_no, i.invoice_date, i.total
  FROM reservations r JOIN
       invoices i ON (r.id = i.res_id);
```

```
 cust_id | room_no | invoice_date | total
---------+---------+--------------+--------
     115 |     106 | 2023-03-13   | 255.00
      43 |     204 | 2023-03-13   | 425.00
      80 |     107 | 2023-03-15   | 340.00
     104 |     309 | 2023-03-16   | 738.00
      95 |     411 | 2023-03-16   | 615.00
      51 |     409 | 2023-03-19   | 123.00
     115 |     203 | 2023-03-20   | 255.00
       2 |     412 | 2023-03-20   | 246.00
     115 |     202 | 2023-03-22   | 170.00
      65 |     411 | 2023-03-23   | 246.00
```

**_Notice:_**

- The new keyword JOIN with ON (predicate)
- Table aliases (`r` and `i`) used to qualify columns

The new syntax follows the following pattern:

```sql
SELECT ...
  FROM ... [JOIN ... ON (...)]...
  [WHERE ...]
  [GROUP BY ... [HAVING ...] ]
  [ORDER BY ...]
```

Use the JOIN to define the combined row source then you can use WHERE, DISTINCT, GROUP BY, ORDER BY, etc... as with single-table queries. For example:

```sql
    SELECT r.cust_id, r.room_no, i.invoice_date, i.total
      FROM reservations r
      JOIN invoices i ON (i.res_id = r.id)
     WHERE r.checkin_date > '2018-07-01'
       AND i.total < 500
  ORDER BY i.invoice_date DESC, r.cust_id;
```

```
 cust_id | room_no | invoice_date | total
---------+---------+--------------+--------
      91 |     211 | 2023-05-04   | 490.00
     117 |     101 | 2023-05-04   | 340.00
      52 |     305 | 2023-05-03   | 110.00
      38 |     411 | 2023-04-30   | 246.00
      18 |     211 | 2023-04-28   | 196.00
       4 |     312 | 2023-04-27   | 369.00
      67 |     401 | 2023-04-27   | 110.00
      88 |     206 | 2023-04-25   |  85.00
      23 |     304 | 2023-04-23   | 110.00
      97 |     309 | 2023-04-22   | 246.00
      .....
```

There is no theoretical limit to the number of tables that can be joined in a query, although practical considerations like
complexity and performance must be considered. It is quite common, though, to find up to seven or eight tables joined in a query.

Multi-table joins just extend the syntax to add more tables, as below:

```sql
SELECT c.name, c.phone, c.email, i.invoice_date, i.total
  FROM customers c
  JOIN reservations r ON (r.cust_id = c.id)
  JOIN invoices i ON (r.id = i.res_id)
  WHERE i.invoice_date < current_date - interval '1 month'
    AND i.paid = FALSE
  ORDER BY i.invoice_date DESC, c.id;
```

```
       name       |     phone      |           email            | invoice_date | total
------------------+----------------+----------------------------+--------------+--------
 Mary Saveley     | 78.32.5555     | mary.saveley@yppl.net      | 2023-04-06   | 255.00
 Alice Evans      | 0161 345 6789  | alice.evans001@hotmail.com | 2023-03-31   | 255.00
 Roland Mendel    | 7675-3555      | roland.mendel@wclf.net     | 2023-03-20   | 255.00
 Eduardo Saavedra | (93) 203 4555  | eduardo.saavedra@tiqa.net  | 2023-03-19   | 123.00
 Wendy Victorino  | +65 224 1555   | wendy.victorino@ueai.net   | 2023-03-15   | 123.00
 Carmen Anton     | +34 913 728555 | carmen.anton@bhmy.net      | 2023-03-14   | 123.00
 Roland Mendel    | 7675-3555      | roland.mendel@wclf.net     | 2023-03-13   | 255.00
```

**_Note_**
You have just learned about what is called the INNER JOIN, which is the most common kind of join. Indeed, you can use the keyword INNER in the JOIN syntax, as follows:

```sql
SELECT c.name, c.phone, c.email, i.invoice_date, i.total
  FROM customers c
  INNER JOIN reservations r ON (r.cust_id = c.id)
  INNER JOIN invoices i ON (r.id = i.res_id)
  WHERE i.invoice_date < current_date - interval '1 month'
    AND i.paid = FALSE
  ORDER BY i.invoice_date DESC, c.id;
```

```
       name       |     phone      |           email            | invoice_date | total
------------------+----------------+----------------------------+--------------+--------
 Mary Saveley     | 78.32.5555     | mary.saveley@yppl.net      | 2023-04-06   | 255.00
 Alice Evans      | 0161 345 6789  | alice.evans001@hotmail.com | 2023-03-31   | 255.00
 Roland Mendel    | 7675-3555      | roland.mendel@wclf.net     | 2023-03-20   | 255.00
 Eduardo Saavedra | (93) 203 4555  | eduardo.saavedra@tiqa.net  | 2023-03-19   | 123.00
 Wendy Victorino  | +65 224 1555   | wendy.victorino@ueai.net   | 2023-03-15   | 123.00
 Carmen Anton     | +34 913 728555 | carmen.anton@bhmy.net      | 2023-03-14   | 123.00
 Roland Mendel    | 7675-3555      | roland.mendel@wclf.net     | 2023-03-13   | 255.00
```

The INNER keyword is not required (it's the default) but some organisations might require it for the sake of coding standards.

There are other kinds of JOIN, specifically the OUTER JOIN and the CROSS JOIN but these are less frequently used in applications.
If you want to find out about these kinds of JOIN refer to the [PostgreSQL documentation](https://www.postgresql.org/docs/12/queries-table-expressions.html).

---

### Exercise 5

1.  Try and understand each of the queries above in your `psql` prompt

Queries are printed above.

2.  Which customers occupied room 111 and what are their details?

```sql
SELECT r.room_no, c.name, c.email, c.phone, c.address, c.city, c.postcode, c.country
FROM customers c
INNER JOIN reservations r
ON (c.id = r.cust_id)
WHERE r.room_no = 111;
```

```
 room_no |     name     |         email         |     phone      |        address         |      city      | postcode |  country
---------+--------------+-----------------------+----------------+------------------------+----------------+----------+-----------
     111 | Palle Ibsen  | palle.ibsen@bjqn.net  | 86 21 3555     | Smagsloget 45          | Århus          | 8200     | Denmark
     111 | Mel Andersen | mel.andersen@nggg.net | 030-0074555    | Obere Str. 57          | Berlin         | 12209    | Germany
     111 | Ben Calaghan | ben.calaghan@bprq.net | 61-7-3844-6555 | 31 Duncan St. West End | South Brisbane | 4101     | Australia
```

3.  List the customer name, room details (room number, type and rate), nights stay and departure dates for all UK customers.

```sql
SELECT c.name, ro.room_no, ro.room_type, ro.rate, re.checkout_date - re.checkin_date AS nights_stay, checkout_date AS depature_date
FROM customers c
INNER JOIN reservations re
ON (c.id = re.cust_id)
INNER JOIN rooms ro
ON (re.room_no = ro.room_no)
WHERE c.country = 'UK'
ORDER BY re.checkout_date;
```

```
       name       | room_no |  room_type   |  rate  | nights_stay | depature_date
------------------+---------+--------------+--------+-------------+---------------
 Sue Jones        |     412 | FAMILY       | 123.00 |           2 | 2023-03-20
 Sue Jones        |     208 | PREMIUM PLUS |  98.00 |           6 | 2023-03-29
 Steven King      |     311 | PREMIER PLUS | 123.00 |           5 | 2023-03-31
 Alice Evans      |     204 | PREMIUM      |  85.00 |           3 | 2023-03-31
 Steven King      |     104 | PREMIUM      |  85.00 |           2 | 2023-04-01
 Helen Bennett    |     110 | PREMIUM PLUS |  98.00 |           5 | 2023-04-03
 Nadia Sethuraman |     211 | PREMIUM PLUS |  98.00 |           3 | 2023-04-06
 Mohammed Trungpa |     311 | PREMIER PLUS | 123.00 |           2 | 2023-04-19
 Mohammed Trungpa |     312 | PREMIER PLUS | 123.00 |           3 | 2023-04-27
 Thomas Smith     |     301 | PREMIER      | 110.00 |           6 | 2023-05-05
 Rachel Ashworth  |     302 | PREMIER      | 110.00 |           5 | 2023-05-09
```

4.  List name, phone and email along with all reservations and invoices for customer Mary Saveley.

```sql
SELECT c.name, c.phone, c.email, r.room_no, r.checkin_date, r.checkout_date, i.invoice_date, i.total, i.paid
FROM customers c
INNER JOIN reservations r
on (c.id = r.cust_id)
INNER JOIN invoices i
ON (r.id = i.res_id)
WHERE c.name = 'Mary Saveley'
ORDER BY r.checkout_date;
```

```
     name     |   phone    |         email         | room_no | checkin_date | checkout_date | invoice_date | total  | paid
--------------+------------+-----------------------+---------+--------------+---------------+--------------+--------+------
 Mary Saveley | 78.32.5555 | mary.saveley@yppl.net |     109 | 2023-03-28   | 2023-03-30    | 2023-03-30   | 196.00 | t
 Mary Saveley | 78.32.5555 | mary.saveley@yppl.net |     206 | 2023-04-03   | 2023-04-06    | 2023-04-06   | 255.00 | f
 Mary Saveley | 78.32.5555 | mary.saveley@yppl.net |     103 | 2023-04-08   | 2023-04-12    | 2023-04-12   | 340.00 | t
```

---

## The Vexing Question of NULL

A column can be assigned a NULL value to indicate it has no value. This can happen when the data for this column is unknown at the time the row is created, for example, employee leaving date, order shipment date, etc... It can also be used when the data is optional.

Be careful with expressions - any expression that includes a NULL value results in NULL as the expression value.

Because NULL is 'no value' it cannot be compared to anything else. For example, you will never get any results from:

```sql
SELECT * FROM customers WHERE postcode = NULL;
```

nor will you get any from:

```sql
SELECT * FROM customers WHERE postcode != NULL;
```

Instead you must use:

```sql
  ... WHERE postcode IS NULL
```

or

```sql
  ... WHERE postcode IS NOT NULL
```

This behaviour has some impacts on operations like JOIN, where NULL values won't match. You could work around this, but see the warning below, by using:

```sql
  ... ON (a.col = b.col OR
          a.col IS NULL AND b.col IS NULL)
```

**_WARNING:_**
_However, be aware that this is not a sensible situation - join columns containing NULL should be expected to not match or should be disallowed (see Primary Keys above)_

You can explicitly provide NULL as a value in INSERT and UPDATE statements, for example:

```sql
    INSERT INTO rooms (room_no, rate, room_type, no_guests)
      VALUES (213, 95.00, NULL, 2);

    UPDATE rooms SET room_type = NULL, no_guests = NULL
      WHERE room_no = 204;
```

In INSERT statements if you omit a column from the column list (following the table name) then that column will be given either:

- an autogenerated value (if it has datatype SERIAL)
- a default value if one has been specified in the CREATE TABLE command
- NULL if neither of the above apply

### Functions to Handle NULL

There are some functions that can operate on NULL values, especially the `coalesce(x, y)` function. This function looks at the first argument `x` and if it is NULL returns the value of the second argument `y` otherwise it returns the value of `x`. For example:

```sql
SELECT room_no, rate, COALESCE(room_type, 'None') type
  FROM rooms
  WHERE no_guests IS NULL;
```

Notes:

- The coalesce function can take more than two arguments and returns the first of these (from left to right) that is not null.
- This feature is provided by most SQL vendors but goes by different names, e.g. ifnull(x, y) in MySQL, nvl(x, y) in Oracle, etc...

---

### Exercise 6

1.  Which customers have not yet provided a phone number?

```sql
SELECT name, COALESCE(phone, 'Not Provided') phone_number
FROM customers
WHERE phone IS NULL;
```

```
       name       | phone_number
------------------+--------------
 Nadia Sethuraman | Not Provided
 John Smith       | Not Provided
```

2.  Update room 304 such that it does not have a room_type.

```sql
UPDATE rooms
SET room_type = NULL, no_guests = NULL
WHERE room_no = 304;
```

```
 room_no |  rate  | room_type | no_guests
---------+--------+-----------+-----------
     304 | 110.00 |           |
```

3.  List customers (name and city) and their reservations replacing the room number with 'Not Assigned' if it is NULL.

```sql
SELECT c.name, c.city, COALESCE(CAST(r.room_no as text), 'Not Assigned') room_number, r.checkin_date, r.checkout_date
FROM customers c
INNER JOIN reservations r
ON (c.id = r.cust_id)
WHERE r.room_no IS NULL;
```

```
        name         |       city       | room_number  | checkin_date | checkout_date
---------------------+------------------+--------------+--------------+---------------
 Laurence Lebihan    | Marseille        | Not Assigned | 2023-05-31   | 2023-06-03
 Carine Schmitt      | Nantes           | Not Assigned | 2023-06-04   | 2023-06-07
 Peter Ferguson      | Melbourne        | Not Assigned | 2023-06-09   | 2023-06-11
 Janine Labrune      | Nantes           | Not Assigned | 2023-05-13   | 2023-05-17
 Jonas Bergulfsen    | Stavern          | Not Assigned | 2023-05-10   | 2023-05-16
 Roland Keitel       | Frankfurt        | Not Assigned | 2023-05-13   | 2023-05-18
 Julie Murphy        | San Francisco    | Not Assigned | 2023-06-05   | 2023-06-09
 Jytte Petersen      | Kobenhavn        | Not Assigned | 2023-05-16   | 2023-05-17
 Eric Natividad      | Singapore        | Not Assigned | 2023-05-18   | 2023-05-21
 Veysel Oeztan       | Bergen           | Not Assigned | 2023-05-12   | 2023-05-13
.....
```

---

## Creating a Table

Use the CREATE TABLE command, which in the simplest case has the general form:

```sql
CREATE TABLE <tablename> (<column definition>, <column definition>, ...);
```

To create an `inventory` table for our hotel we might need:

```sql
CREATE TABLE inventory (
  id            SERIAL PRIMARY KEY,
  description   VARCHAR(30) NOT NULL,
  cost          NUMERIC(6,2)
);
```

**_Note: you may never need to do this. Database design is a task that requires specialist skills and considerable experience._**

### Naming Tables and Columns

In the `CREATE TABLE` command you must give the name of the table (e.g. `inventory`) and the names of each of the columns (in the parenthesised column definitions) (e.g. `id`, `description`, `cost`).

Names of tables and columns (and any other objects in the database) must start with a letter, can contain letters, digits and the underscore symbol (\_) up to 64 bytes (in PostgreSQL). Names are not case-sensitive so that NAME, name and NaMe are all the same.

### Data Types of Columns

In the above example:

```
Column        | Data Type    | Other
--------------+--------------+-------------
`id`          | SERIAL       | PRIMARY KEY
`description` | VARCHAR(30)  | NOT NULL
`cost`        | NUMERIC(6,2) |
```

The `id` column uses SERIAL as its data type, making it an autoincrementing integer that increments by 1, starting from 1, for each time a new row is inserted into the table. For this to work, the `id` column must be omitted from the INSERT command. `id` is also designated as the PRIMARY KEY of the table (note that SERIAL doesn't make the column the primary key). PRIMARY KEY also implies that the column cannot be set to NULL.

The `description` column is a variable length character value (VARCHAR) that can hold up to a maximum of 30 characters. The NOT NULL constraint means the value cannot be left empty, each row must have a description.

The `cost` column is NUMERIC(6,2), a number that can accurately store up to 6 digits, two of which are the fractional part. For example, it can hold 1234.56, -23.45 or 0.01. Note that the NUMERIC data type stores and computes values using decimal values and does not lose accuracy in the same was as, say, floating point values. NUMERIC values take longer in calculations because they don't use simple binary values - user either integer or floating point for speed with compute-heavy numbers.

**NEVER** use floating point for financial values.

### **Other Common Data Types**

There are several more standard data types (plus a few non-standard ones), including:
Type | Notes
--- | ---
INTEGER | binary integer with 32 bits (range approx -2 x 10<sup>9</sup> &ndash; +2 x 10<sup>9</sup>)
DATE | dates with no time component
TIMESTAMP | date and time (accurate to milliseconds)
BOOLEAN | TRUE, FALSE or NULL
TEXT | variable length text with no length limit (up to max allowed for the RDBMS - about 1Gb in PostgreSQL)

You can read more about data types in the PostgreSQL documentation. Refer to https://www.postgresql.org/docs/12/datatype.html
for more information.

### Changing a Table Definition

Using the ALTER TABLE command to add and remove columns:

```sql
ALTER TABLE inventory ADD COLUMN room_no INTEGER;

ALTER TABLE customers DROP COLUMN phone;
```

There are some constraints on adding and removing columns, for example, you cannot add a NOT NULL column to a table that already contains some rows.

---

### Exercise 7

1.  Create a table for charge points. This must record the hotel shops, bars, cafes and restaurants that a customer can use during their stay.

2.  Include an auto-incrementing primary key

3.  Include the charge point name, a description and maximum customer credit value

```sql
CREATE TABLE charge_points (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(20) NOT NULL,
  description     VARCHAR(30) NOT NULL,
  credit_limit    NUMERIC(6,2)
);
```

```
 id | name | description | credit_limit
----+------+-------------+--------------
```

4.  Insert charge points for 'Shop', 'Pool Bar', 'Elysium Restaurant' and 'Room Service' with credit limits of £1000 for each.

```sql
INSERT INTO charge_points(name, description, credit_limit)
VALUES ('Shop', 'Shop on the ground floor', 1000), ('Pool Bar', 'Pool bar on the third floor', 1000), ('Elysium Restaurant', 'Restaurant on the top floor', 1000), ('Room Service', 'The hotel room service', 1000);
```

```
 id |        name        |         description         | credit_limit
----+--------------------+-----------------------------+--------------
  1 | Shop               | Shop on the ground floor    |      1000.00
  2 | Pool Bar           | Pool bar on the third floor |      1000.00
  3 | Elysium Restaurant | Restaurant on the top floor |      1000.00
  4 | Room Service       | The hotel room service      |      1000.00
```

5.  Create a table for charge items that records amounts charged to rooms by customers using our shop, bars, restaurants, etc. This must include the room number of the room charged, the charge point used, the amount, the date and time of the charge and any customer comments.

```sql
CREATE TABLE charge_items (
  id                SERIAL PRIMARY KEY,
  room_no           INTEGER NOT NULL,
  charge_point_id   INTEGER NOT NULL,
  amount            NUMERIC(6,2),
  date_time         TIMESTAMP NOT NULL,
  customer_comments VARCHAR(100)
);
```

```
 id | room_no | charge_point_id | amount | date_time | customer_comments
----+---------+-----------------+--------+-----------+-------------------
```

---

## Defining Primary and Foreign Keys

### Defining Primary Keys

Use the following templates to define a Primary Key.

For a single-column PK use:

```sql
CREATE TABLE <table name> (
  ...
  <column name>   <data type>   PRIMARY KEY,
  ...
)
```

For example:

```sql
CREATE TABLE rooms (
  room_no       INTEGER   PRIMARY KEY,
  ...
);
```

To define a multi-column primary key you must define a constraint separate from the column definitions, as below:

```sql
CREATE TABLE <table name> (
  ...
  <pk col 1>     <data type>,
  <pk col 2>     <data type>,
  ... ,
  PRIMARY KEY (<pk col 1>, <pk col 2>),
  ...
);
```

For example:

```sql
CREATE TABLE invoice_items (
  inv_id        INTEGER REFERENCES invoices(id),
  item_no       INTEGER,
  ... ,
  PRIMARY KEY (inv_id, item_no),
  ...
);
```

There can be only one primary key in a table definition. The `PRIMARY KEY` definition implies NOT NULL so no column in a table's PK can be set to NULL.

**Note: a partial primary key can be a foreign key as well.**

### Defining Foreign Keys

To define foreign keys use either:

For a single-column foreign key:

```sql
  <column name>   <data type>   REFERENCES <table name> (<column name>);
```

where the &lt;column name&gt; in the REFERENCES clause is the column name in the referenced table, not the one being defined at this point. For example, in the `reservations` table:

```sql
  ...
  cust_id         INTEGER NOT NULL   REFERENCES customers (id),
  ...
```

For multi-column foreign keys we must again use a separate constraint definition, as shown:

```sql
CREATE TABLE customer_challenges (
  id           SERIAL PRIMARY KEY,
  inv_id       INTEGER,
  item_no      INTEGER,
  ...
  FOREIGN KEY (inv_id, item_no) REFERENCES invoice_items (inv_id, item_no),
  ...
);
```

---

### Exercise 8

1.  Try to delete the customer Mary Saveley. What happens and why?

```sql
DELETE FROM customers
WHERE name = 'Mary Saveley';
```

```
ERROR:  update or delete on table "customers" violates foreign key constraint "res_guest_fk" on table "reservations"
DETAIL:  Key (id)=(25) is still referenced from table "reservations".
```

We cannot delete the record from the `customers` table.
Because in `build-hotel.sql` when the `reservations` table is created there is a link established between the `cust_id` in the `reservations` table and the `id` in the `customers` table.

```sql
CREATE TABLE reservations (
  id            SERIAL PRIMARY KEY,
  cust_id       INTEGER NOT NULL,
  room_no       INTEGER,
  checkin_date  DATE NOT NULL,
  checkout_date DATE,
  no_guests     INTEGER,
  booking_date  DATE,
  CONSTRAINT res_guest_fk FOREIGN KEY (cust_id) REFERENCES customers(id),
  CONSTRAINT res_room_fk  FOREIGN KEY (room_no) REFERENCES rooms(room_no)
);
```

2.  Insert a new room, number 313 as room type 'SUPER PREMIER'.

```sql
INSERT INTO rooms (room_no, rate, room_type, no_guests)
VALUES (313, 136.00, 'SUPER PREMIER', 2);
```

```
ERROR:  insert or update on table "rooms" violates foreign key constraint "rooms_room_type_fkey"
DETAIL:  Key (room_type)=(SUPER PREMIER) is not present in table "room_types".
```

The `room_types` table does not contain a PRIMARY KEY `'SUPER PREMIER'` and therefore it will not allow us to add a record with this `room_type`.

```sql
CREATE TABLE room_types (
    room_type           VARCHAR(30) PRIMARY KEY,
    def_rate            NUMERIC(6,2)
);

INSERT INTO room_types VALUES('FAMILY',123.00);
INSERT INTO room_types VALUES('PREMIER',110.00);
INSERT INTO room_types VALUES('PREMIER PLUS',123.00);
INSERT INTO room_types VALUES('PREMIUM',85.00);
INSERT INTO room_types VALUES('PREMIUM PLUS',98.00);

CREATE TABLE rooms (
  room_no INTEGER PRIMARY KEY,
  rate NUMERIC(6,2) NOT NULL,
  room_type VARCHAR(30),
  no_guests INTEGER,
  FOREIGN KEY (room_type) REFERENCES room_types(room_type)
);
```

We could solve this by first inserting a new record into `room_types` and then trying the operation again.

```sql
INSERT INTO room_types (room_type, def_rate)
VALUES ('SUPER PREMIER', 136.00);
```

```
   room_type   | def_rate
---------------+----------
 FAMILY        |   123.00
 PREMIER       |   110.00
 PREMIER PLUS  |   123.00
 PREMIUM       |    85.00
 PREMIUM PLUS  |    98.00
 PENTHOUSE     |   185.00
 SUPER PREMIER |   136.00
```

```sql
INSERT INTO rooms (room_no, rate, room_type, no_guests)
VALUES (313, 136.00, 'SUPER PREMIER', 2);
```

```
 room_no |  rate  |   room_type   | no_guests
---------+--------+---------------+-----------
     313 | 136.00 | SUPER PREMIER |         2

```

3.  Define primary and foreign keys required by the charge_items table

```sql
ALTER TABLE charge_items
ADD PRIMARY KEY (id)
```

(this was already done above on table creation)

```sql
ALTER TABLE charge_items
ADD FOREIGN KEY (charge_point_id)
REFERENCES charge_points(id);
```

```
      Column       |            Type             | Collation | Nullable |                 Default
-------------------+-----------------------------+-----------+----------+------------------------------------------
 id                | integer                     |           | not null | nextval('charge_items_id_seq'::regclass)
 room_no           | integer                     |           | not null |
 charge_point_id   | integer                     |           | not null |
 amount            | numeric(6,2)                |           |          |
 date_time         | timestamp without time zone |           | not null |
 customer_comments | character varying(100)      |           |          |
Indexes:
    "charge_items_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "charge_items_charge_point_id_fkey" FOREIGN KEY (charge_point_id) REFERENCES charge_points(id)
```

4.  Insert some rows into the charge_items table. You can invent the details.

```sql
INSERT INTO charge_items (room_no, charge_point_id, amount, date_time, customer_comments)
VALUES
  (101, 1, 10.00, '2023-05-10 10:00:00.000000+00', 'Nice Gift Shop'),
  (202, 2, 50.00, '2023-05-10 14:00:00.000000+00', 'Fun games of Pool!'),
  (303, 3, 80.00, '2023-05-10 19:00:00.000000+00', 'Great restaurant and views!'),
  (404, 4, 15.00, '2023-05-11 01:00:00.000000+00', 'I need a Snack in bed ;)');
```

```
 id | room_no | charge_point_id | amount |      date_time      |      customer_comments
----+---------+-----------------+--------+---------------------+-----------------------------
  1 |     101 |               1 |  10.00 | 2023-05-10 10:00:00 | Nice Gift Shop
  2 |     202 |               2 |  50.00 | 2023-05-10 14:00:00 | Fun games of Pool!
  3 |     303 |               3 |  80.00 | 2023-05-10 19:00:00 | Great restaurant and views!
  4 |     404 |               4 |  15.00 | 2023-05-11 01:00:00 | I need a Snack in bed ;)
```

---
