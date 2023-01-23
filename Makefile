all : dir build run

dir : dir_db dir_pgadmin

dir_db :
	sudo mkdir -p postgres

dir_pgadmin :
	sudo mkdir -p pgadmin

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