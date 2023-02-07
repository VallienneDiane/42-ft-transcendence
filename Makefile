all : run

run :
	sudo docker-compose -f docker-compose.yml up --build

down:
	sudo docker-compose -f docker-compose.yml down

re : clean all

ps :
	docker images
	docker ps
	docker volume ls

down :
	docker-compose -f docker-compose.yml down

clean : prune
		docker volume rm -f db back front
		sudo rm -rf ./postgres

prune :
	echo y | docker system prune -a

logs :
	docker-compose logs

make_dir :
			mkdir -p postgres

# docker-compose -f docker-compose.yml down; docker rm $(docker ps -qa); 
# docker rmi -f $(docker images -qa); docker volume rm $(docker volume ls -q);