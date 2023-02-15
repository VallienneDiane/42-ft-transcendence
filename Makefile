NETWORKS := $(shell docker network ls --quiet)
VOLUMES := $(shell docker volume ls --quiet)
IMAGES := $(shell docker images --quiet)
CONTAINERS := $(shell docker ps --quiet)
OWNER := $(shell echo $(USER))

all : make_dir build run

build :
	docker-compose -f docker-compose.yml build

run :
	docker-compose -f docker-compose.yml up #-d

down :
	docker-compose -f docker-compose.yml down

stop :
	docker-compose -f docker-compose.yml stop

start :
	docker-compose -f docker-compose.yml start

re : fclean all

clean : down
ifneq ($(strip $(CONTAINERS)),)
	docker rm -f $(CONTAINERS)
endif
ifneq ($(strip $(IMAGES)),)
	docker rmi -f $(IMAGES)
endif
# ifneq ($(strip $(NETWORKS)),)
# 	docker network rm $(NETWORKS)
# endif

vclean :
ifneq ($(strip $(VOLUMES)),)
	docker volume rm $(VOLUMES)
endif
	sudo rm -rf ./back/postgres

fclean : clean vclean prune

prune :
	docker system prune -a

logs :
	docker-compose logs

make_dir : make_dir_db

make_dir_db :
	mkdir -p ./back/postgres

ls :
	@docker ps -a
	@echo ""
	@docker images -a
	@echo ""
	@docker volume ls
	@echo ""
	@docker network ls
