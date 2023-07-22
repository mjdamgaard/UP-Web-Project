# Change the config files of this folder!

Change the config files of this folder to match the your setup of the SDB and
the userDB databases.

To install this prototype and run it, you will first need a PHP server (I am
using Apache 2) and a MySQL server. (These can be easily installed and run on
your computer. See https://www.php.net/manual/en/install.php for how to install
PHP and https://dev.mysql.com/doc/mysql-getting-started/en/ for how to install
MySQL.)

And when you have your MySQL server installed, create two databases and change
the config files of this folder
to match the passwords and names that you choose.

Install the SDB in one of these databases by running create_sdb.sql,
input_procs.sql and query_procs.sql followed by initial_inserts.sql at last.
(One way to do this, at least with Linux, is to run
$ `mysql -u your_username -p -D your_database_name`
to select your database, after which the SQL programs can be run with a command
like `\. your_path/create_sdb.sql`.)

Install the user credentials database *...*

*The user credentials database is not needed yet in order to run the prototype.*
