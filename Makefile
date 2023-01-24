all : make_dir build run

build :
	sudo docker-compose -f docker-compose.yml build

run :
	sudo docker-compose -f docker-compose.yml up -d

re : prune all

clean : down prune

down :
	sudo docker-compose -f docker-compose.yml down

vclean :
	sudo docker volume rm -f pgadmin postgres nest react
	sudo rm -rf ./pgadmin
	sudo rm -rf ./postgres

prune :
	echo y | sudo docker system prune -a

logs :
	sudo docker-compose logs

make_dir : make_dir_db make_dir_pgadmin

make_dir_db :
	sudo mkdir -p postgres

make_dir_pgadmin :
	sudo mkdir -p pgadmin