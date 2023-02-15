all : run

run :
	docker-compose -f docker-compose.yml up --build

down:
	docker-compose -f docker-compose.yml down

re : clean all

ps :
	docker images
	docker ps
	docker volume ls

clean : prune
		docker-compose -f docker-compose.yml down
		docker volume rm -f db back front pgadmin
		rm -rf ./postgres
		rm -rf ./pgadmin

prune :
	echo y | docker system prune -a

logs :
	docker-compose logs

make_dir :
			mkdir -p postgres
# mkdir -p pgadmin

# docker-compose -f docker-compose.yml down; docker rm $(docker ps -qa); 
# docker rmi -f $(docker images -qa); docker volume rm $(docker volume ls -q);