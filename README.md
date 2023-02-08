# TRANSCENDENCE

Implement a website where users can play Pong with each other. 
There are a user interface, a chat and the games will be multiplayer online and in real time.

Some rules :

<p align="center">
<img src="transcendence.png" width="1000">
</p>

<p align="center">
<img src="https://www.bezkoder.com/wp-content/uploads/2020/03/react-node-express-postgresql-crud-example-architecture.png" width="500">
</p>

## INSTALL FRAMEWORKS

## NODEJS

<p align="center">
<img src="https://imgs.search.brave.com/siYYlprg8CKMxqTSw4jv8Ma2VnLTdEqOQZqcsh_qQM0/rs:fit:1200:1200:1/g:ce/aHR0cHM6Ly9kb3du/bG9hZC5sb2dvLndp/bmUvbG9nby9Ob2Rl/LmpzL05vZGUuanMt/TG9nby53aW5lLnBu/Zw" width="200">
</p>

Node.js is not a programming language. 
Node.js is an open-source runtime environment for the JavaScript language that reshapes JavaScript’s characteristics and upgrades its functionality.

#### Installation guide on Debian 10 :

https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-debian-10

	sudo apt install curl
	su -
	curl -fsSL https://deb.nodesource.com/setup_19.x | bash - && apt-get install -y nodejs
	node -v
	npm -v

## NESTJS

<p align="center">
<img src="https://imgs.search.brave.com/whas0hjkR981TA2evmgspzOtUKKjcSCOnJdRNgizY2w/rs:fit:960:467:1/g:ce/aHR0cHM6Ly92ZXJp/ZmVyZGlhbnN5YWgu/Y29tL3N0YXRpYy9k/NGM4NTY2OTA4MWQ2/MWFkMjFlY2JmMTY1/ZmU3NjgxYi83ZDc2/OS9uZXN0anNfbG9n/by5wbmc" width="200">
</p>

Nest is a framework for building efficient, scalable Node.js server-side applications. It uses progressive JavaScript, is built with and fully supports TypeScript.

#### Installation guide :

https://docs.nestjs.com/cli/overview

	npm install -g @nestjs/cli
	nest new <nameproject>
	npm install -g npm@9.3.1

## REACT

<p align="center">
<img src="https://imgs.search.brave.com/6PDkpxLSa1Xfaq__JHSG9OqsAKF8VSMAXa7oaRvzDOI/rs:fit:840:795:1/g:ce/aHR0cHM6Ly93d3cu/cG5nZmluZC5jb20v/cG5ncy9tLzY4NS02/ODU0OTcwX3JlYWN0/LWxvZ28tcG5nLXBu/Zy1kb3dubG9hZC1s/b2dvLXBuZy1yZWFj/dGpzLnBuZw" width="200">
</p>

React is a front-end JavaScript library developed by Facebook. Its aim is to allow developers to easily create fast user interfaces for websites and applications alike. The main concept of React js is virtual DOM. React is capable of making API calls (sending the request to the backend), which deal with the data. React cannot process the database or the data source itself.

#### Installation guide :

	npm install npm@latest -g
	npm create vite@latest(choose React and give a name)
	cd project-name
	Open port in VM

	npm update --save react 
	npm view react version

	In vite.config :

	// https://vitejs.dev/config/
	export default defineConfig({
	plugins: [react()],
	server: {
		port: 8000
	}
	})

	In package.json, add this to scripts : 
	"host": "vite --host"

## CONTAINERIZATION USING DOCKER

<p align="center">
<img src="https://imgs.search.brave.com/fJ0XoOAkhu9ASBJ1vahXdYCCtCMUKDYr5aLE2q2Zhvs/rs:fit:1200:1200:1/g:ce/aHR0cHM6Ly9sb2dv/cy13b3JsZC5uZXQv/d3AtY29udGVudC91/cGxvYWRzLzIwMjEv/MDIvRG9ja2VyLUxv/Z28tMjAxMy0yMDE1/LnBuZw" width="200">
</p>

### PostgreSQL

<p align="center">
<img src="https://imgs.search.brave.com/hF7n4_uyADu8Zflp9AugEHEJbLt7oCfYYGAlwu-yHhE/rs:fit:880:867:1/g:ce/aHR0cHM6Ly93d3cu/cGluY2xpcGFydC5j/b20vcGljZGlyL21p/ZGRsZS81MTktNTE5/OTIyNF9wb3N0Z3Jl/c3FsLWxvZ28tcG5n/LXRyYW5zcGFyZW50/LWNsaXBhcnQucG5n" width="200">
</p>

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


- MODULE

Module is a class annotated with a Module decorator. Modules allows to organize the application structure/components.

The starting point of the Nest to build the app graph is the Application module.
Each module has his properties : providers, controllers, imports, exports.

	chat module
	authentification module
	game module
	etc

Each module has controller and service.

- CONTROLLER

Controller handle incoming requests and returning responses to the client.
In the controller you specified the post request and call the functions in the file service.
To visualize the post request you can use Postman. It is an application that allows us to test APIs utilizing a graphical user interface.

- PROVIDERS

A provider can be injected as a dependency. This means objects can create relationships btw them.
A Service is a provider which use a decorator @Injectable(), it can have class and methods.


## IMPLEMENT THE FEATURES

## 1. AUTHENTIFICATION (get login and create JWT Token)

### Login

In React : create a form that allows the user to enter their login and password. When the form is submitted, dispatch an action that sends a request to the back-end to create a new user account.

In Nest.js : create a controller that listens for the request from the front-end and creates a new user in the database. To interact with the database, use a database library such as TypeORM.

In the controller, you can use the TypeORM Repository to insert a new user into the database. You can retrieve the login and password from the request body and use them to create a new instance of your User model. Then you can save the user to the database using the Repository.save() method.

After the user is successfully saved, you can return a response to the front-end indicating that the account was created.

https://medium.com/att-israel/authentication-authorization-using-react-nestjs-jwt-token-55f52070a3f2


## OAuth

https://www.youtube.com/watch?v=Iv77m1mxAWE


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

