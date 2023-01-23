all : make_dir build run

build :
	sudo docker-compose -f docker-compose.yml build

run :
	sudo docker-compose -f docker-compose.yml up -d

re : prune all

clean : down
		sudo docker rmi -f $(docker images -qa)

fclean : clean vclean

down :
	sudo docker-compose -f docker-compose.yml down

vclean :
	sudo docker volume rm $(docker volume ls -q)
	sudo rm -rf ./pgadmin
	sudo rm -rf ./postgres

prune : fclean
	echo y | sudo docker system prune -a

logs :
	sudo docker-compose logs

make_dir : make_dir_db make_dir_pgadmin

make_dir_db :
	sudo mkdir -p postgres

make_dir_pgadmin :
	sudo mkdir -p pgadmin