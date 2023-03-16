sudo rm -r /var/www/html/*
sudo cp -r /home/madsjd/GitHub/SemDB_prototyping/html /var/www/
sudo rm -r /var/www/src/*
sudo cp -r /home/madsjd/GitHub/SemDB_prototyping/src /var/www/
sudo rm -r /var/www/templates/*
sudo cp -r /home/madsjd/GitHub/SemDB_prototyping/templates /var/www/

sudo /etc/init.d/apache2 restart
