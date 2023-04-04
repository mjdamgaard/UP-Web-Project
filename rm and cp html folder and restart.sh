sudo rm -r /var/www/html/*
sudo cp -r /home/madsjd/GitHub/SemDB_prototyping/html /var/www/
sudo rm -r /var/www/src/*
sudo cp -r /home/madsjd/GitHub/SemDB_prototyping/src /var/www/
sudo rm -r /var/www/UPA_cached_modules/*
sudo cp -r /home/madsjd/GitHub/SemDB_prototyping/UPA_cached_modules /var/www/

sudo /etc/init.d/apache2 restart
