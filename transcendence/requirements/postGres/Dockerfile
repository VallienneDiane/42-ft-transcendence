FROM debian:buster

RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' &&\
	wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - &&\
	apt-get update && \
	apt-get -y install postgresql && \
	sudo -u postgres -i

EXPOSE 3306

CMD ["postgres"]