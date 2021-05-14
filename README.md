Mechfinder Web App
=================

Primary website for mechfinder.com

Quick start
-----------

Clone the repo:

```
git clone git@github.com:landen1221/dev.mechfinder.com.git
```

Install global dependencies
---------------------------

* OSX:
 - Install gcloud command tools
 - Install node 4.2.2 via Node Version Manager (nvm)
 - Install mongoDB
 - copy the data folder over to the main level directory

The CoffeeScript package will need to be installed globally. After node is installed:

```
npm install -g coffee-script`
```

The pm2 package will also need to be installed globally:

```
npm install -g pm2
```

Install local dependencies
--------------------------

Use the `npm` utility to load the many nodejs modules that are required, depending on your directory permissions you may have to run this with `sudo`:

```
$ npm install
```

Start mongo db
-------------------------------

start an instance of mongodb running on 127.0.0.1:27017 (default), make sure to also set up a /data/db/ directory or point the --dpath=/wherever/you/want/your/data/stored/ :

```
mongod
```

and to connect to the running instance of the database from terminal run:

```
mongo
```

Start Redis
-------------------------------

Redis is a lightweight and fast solution used for storing the session keys. Install and start an instance of Redis running on 127.0.0.1:6379 (default) :

OSX
```
brew install redis
redis-server
```

LINUX
```
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
cd src
redis-erver
```

Preparing external data sources
-------------------------------

Several external data sources are used by Mechfinder. All tasks can be performed using `cake`:

1. Install geolocation data files: `cake fetch-geo`
2. Install zip code data files: `cake fetch-zip`
3. Install vehicle make and model data into mongo: `cake load-makes`

Be sure to monitor CPU usage, particuarly during the zip code import, as the process reports success but
is still busily sending data to mogno. Kill the process once CPU usage drops to zero.

Start the server locally
----------------

Start the local server for debugging with:

```
cake -w run
```

Use the `-w` flag to indicate that the all coffee files should be monitored for changes and the server restarted when
changes are detected. This is ideal for the development environment. In production there is no need to use the `-w` flag.

To start the server using pm2 run the command:

```
pm2 startOrRestart ecosystem.json
```

On the Google Cloud development server we are using pm2 to run and manage deployments so this way will mimmic that
environment closely.

Deploy and run on Google Cloud
----------------

Some steps to get configured on google cloud are necessary:

1. ensure you have a private and public key pair to use (using the same ones as git is recommended)
2. add your public key to the vm instance of the app (id_rsa.pub)
3. add your private key (id_rsa) for connecting with git into /home/yourUserName/.ssh directory
4. add your username to the ecosystem.json file

* VM config
- ensure the vm you are deploying to has a mongoDB instance running on it
- ensure the vm has nvm installed and has Node 4.2.2 installed
- ensure the vm has pm2 installed globally
- manually add the IP-COUNTRY-REGION-CITY-LATITUDE-LONGITUDE.bin file to the data folder

to deploy and run:

```
pm2 deploy ecosystem.json development
```

to troubleshoot any problems ssh into the vm and check that the correct node version is being used (4.2.2),
if it is not then install nvm and use that to switch it. Check that pm2 is installed globally and does not have
any other daemons currently running. Also make sure all files are present in /var/www/{development/production}/source/

changing files inside the vm is easy to do with FileZilla, it just takes adding the configurations and also
importing your private key in sftp connections

Authors
-------

Andrew Pratt
