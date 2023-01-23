all : dir build run

dir : dir_db dir_pgadmin

dir_db :
	sudo mkdir -p db

dir_pgadmin :
	sudo mkdir -p pgadmin

build :
	sudo docker-compose -f docker-compose.yml build

run :
	sudo docker-compose -f docker-compose.yml up -d

re : start
	sudo docker-compose -f docker-compose.yml up -d --build

clean :
	sudo docker rmi -f $(docker images -qa); echo y | docker builder prune -a

fclean : clean down

down :
	sudo docker-compose -f docker-compose.yml down

vclean :
	sudo rm -rf db pgadmin
	sudo docker volume rm -f data pgadmin

prune : down vclean
	echo y | sudo docker system prune -a

logs :
	sudo docker-compose logs