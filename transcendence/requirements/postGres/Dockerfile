FROM debian:buster

RUN apt-get update && apt-get install -y postgresql &&\
	mkdir -p /var/lib/postgresql &&\
	chown -R postgres:postgres /var/lib/postgresql

EXPOSE 3306

CMD ["postgres"]