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
