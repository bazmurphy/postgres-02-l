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
