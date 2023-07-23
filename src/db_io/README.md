# Change the config file of this folder!

Change the config file of this folder to match the your setup of the SDB.

To install this prototype and run it, you will first need a PHP server (I am
using Apache 2) and a MySQL server. (These can be easily installed and run on
your computer. See https://www.php.net/manual/en/install.php for how to install
PHP and https://dev.mysql.com/doc/mysql-getting-started/en/ for how to install
MySQL.)

And when you have your MySQL server installed, create a databases and change
the config files of this folder
to match the passwords and names that you choose.

Install the SDB in that database by running create_sdb.sql, input_procs.sql,
query_procs.sql and user_data_procs.sql followed by initial_inserts.sql at last.
(One way to do this, at least with Linux, is to run
$ `mysql -u your_username -p -D your_database_name`
to select your database, after which the SQL programs can be run with commands
like `\. your_path/create_sdb.sql`.)
