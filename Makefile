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
		docker volume rm -f nest-db back front
		sudo rm -rf ./postgres

prune :
	echo y | docker system prune -a

logs :
	docker-compose logs

make_dir :
			mkdir -p postgres

# docker-compose -f docker-compose.yml down; docker rm $(docker ps -qa); 
# docker rmi -f $(docker images -qa); docker volume rm $(docker volume ls -q);