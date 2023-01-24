# TRANSCENDENCE

Implement a website where users can play Pong with each other. 
There are a user interface, a chat and the games will be multiplayer online and in real time.

Some rules :

<p align="center">
<img src="transcendence.png" width="1000">
</p>

## INSTALL FRAMEWORKS

### Node JS

Node.js is not a programming language. 
Node.js is an open-source runtime environment for the JavaScript language that reshapes JavaScript’s characteristics and upgrades its functionality.

#### Installation guide on Debian 10 :

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-debian-10

	sudo apt install curl
	su -
	curl -fsSL https://deb.nodesource.com/setup_19.x | bash - && apt-get install -y nodejs
	node -v
	npm -v

### Nest JS

Nest is a framework for building efficient, scalable Node.js server-side applications. It uses progressive JavaScript, is built with and fully supports TypeScript.

#### Installation guide :

https://docs.nestjs.com/cli/overview

	npm install -g @nestjs/cli
	npm install -g npm@9.3.1

### React

React is a front-end JavaScript library developed by Facebook. Its aim is to allow developers to easily create fast user interfaces for websites and applications alike. The main concept of React js is virtual DOM. React is capable of making API calls (sending the request to the backend), which deal with the data. React cannot process the database or the data source itself.

#### Installation guide :

	npm install npm@latest -g
	npm create vite@latest
	Choose React and give a name to the project
	cd project-name
	npm install
	npm run dev
	Open port in VM

	npm update --save react 
	npm view react version

## CONTAINERIZATION USING DOCKER

### PostgreSQL

PostgreSQL is an advanced, enterprise class open source relational database that supports both SQL (relational) and JSON (non-relational) querying.

POSTGRES IMAGE : https://hub.docker.com/_/postgres
POSTGRESQL CLI : https://www.geeksforgeeks.org/postgresql-create-database/?ref=lbp

Build and run container: 
	docker run --name postgres -e POSTGRES_PASSWORD=mypassword -d postgres

Exec container :
	docker exec -t <name> bash  		//get into container
	su - postgres						//role root
	psql postgres						//access to CLI
	\l	or \l+							//listing databases
	\c <name>							//connect db
	\dt									//listing tables
	\d <name_table>						//see table structure
	\q									//quit table/database

	CREATE DATABASE <name>; CREATE DATABASE
	CREATE TABLE IF NOT EXISTS person (
    	ID 	INT PRIMARY KEY,
    	First_name VARCHAR(50) NOT NULL,
    	Last_name VARCHAR(50) NOT NULL,
    	Login VARCHAR(100) UNIQUE,
    	Email VARCHAR(100) UNIQUE,
	);

	docker-compose down -v
	docker-compose up

### Pgadmin : front-end database

pgAdmin is a management tool for PostgreSQL and derivative relational databases.

PGADMIN IMAGE : https://hub.docker.com/r/dpage/pgadmin4

### React App using Vite

Guide To Dockerize React App :
https://javascript.plainenglish.io/step-by-step-guide-to-dockerize-react-app-created-using-vite-90772423f7fb

### NestJS

Guide To Dockerize NestJS App :

https://www.tomray.dev/nestjs-docker-production
https://dev.to/erezhod/setting-up-a-nestjs-project-with-docker-for-back-end-development-30lg

# FRONT-END USING REACT 

## JAVASCRIPT

Notions :
	- const, let
	- sucre syntaxique (++, ??, person?.age, const {name, ...others} = (), const [note1, note2, ...others] = [12, 4, 15, 20])
	- timers : blocking and asynchronous functions (wait != setTimeOut)
	- promise : is an object (Promise) that represents the completion or failure of an asynchronous operation
	  (resolve, reject, catch, then, finally) - (const p = new Promise(resolve, reject))

# SOURCES

## DOCUMENTATIONS

NestJS : https://docs.nestjs.com/

React : https://reactjs.org/

## REACT

Formation React : https://grafikart.fr/formations/react

Roadmap React : https://roadmap.sh/react/

Use Forms React Hook Form : https://reactjs.org/docs/hooks-custom.html

Use REST react-query : https://www.youtube.com/watch?v=novnyCaa7To

Use Styling Materia UI : https://mui.com/

