pushd . & cd database & start mongod --dbpath . & popd
pushd . & cd name-server & start node app & popd
pushd . & cd game-server & start node app & popd
pushd . & cd web-server & start node app & popd