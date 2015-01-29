mkdir database

cd database
mongod --dbpath . & 
cd ..

cd name-server
node app &
cd ..

cd game-server
node app &
cd ..

cd web-server
node app &
cd ..
