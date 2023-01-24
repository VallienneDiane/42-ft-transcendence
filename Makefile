all : make_dir build run

build :
	docker-compose -f docker-compose.yml build

run :
	docker-compose -f docker-compose.yml up -d

re : clean all

clean : down prune

down :
	docker-compose -f docker-compose.yml down

vclean :
	docker volume rm -f pgadmin postgres nest react
	rm -rf ./pgadmin
	rm -rf ./postgres

prune :
	echo y | docker system prune -a

logs :
	docker-compose logs

make_dir : make_dir_db make_dir_pgadmin

make_dir_db :
	mkdir -p postgres

make_dir_pgadmin :
	mkdir -p pgadmin