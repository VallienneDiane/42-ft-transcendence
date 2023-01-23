all : build run

build :
	sudo docker-compose -f docker-compose.yml build

run :
	sudo docker-compose -f docker-compose.yml up -d

re : start
	sudo docker-compose -f docker-compose.yml up -d --build

clean : down
		sudo docker rmi -f $(docker images -qa); echo y | sudo docker builder prune -a

fclean : clean down

down :
	sudo docker-compose -f docker-compose.yml down

vclean :
	sudo docker volume rm $(docker volume ls -q)
	sudo rm -rf /home/$(USER)/data/pgadmin/*
	sudo rm -rf /home/$(USER)/data/postgres/*

prune : down vclean
	echo y | sudo docker system prune -a

logs :
	sudo docker-compose logs