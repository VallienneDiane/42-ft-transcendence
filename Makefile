all : make_dir build run


build :
	docker-compose -f docker-compose.yml build

run :
	docker-compose -f docker-compose.yml up -d

re : clean all

ps :
	docker images
	docker ps
	docker volume ls

down :
	docker-compose -f docker-compose.yml down

clean : down prune
		docker volume rm -f nest-db pgadmin back front
		sudo rm -rf ./postgres
		sudo rm -rf ./pgadmin

prune :
	echo y | docker system prune -a

logs :
	docker-compose logs

make_dir : make_dir_db make_dir_pgadmin

make_dir_db :
			mkdir -p postgres

make_dir_pgadmin :
			mkdir -p pgadmin


# docker-compose -f docker-compose.yml down; docker rm $(docker ps -qa); 
# docker rmi -f $(docker images -qa); docker volume rm $(docker volume ls -q);