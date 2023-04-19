IMAGES := $(shell docker images --quiet)
CONTAINERS := $(shell docker ps --quiet)
VOLUMES := $(shell docker volume ls --quiet)

all : run

run :
	docker-compose -f docker-compose.yml up --build

down:
	docker-compose -f docker-compose.yml down

re : prune all

ps :
	docker images
	docker ps
	docker volume ls

clean : down
ifneq ($(strip $(CONTAINERS)),)
	docker rm -f $(CONTAINERS)
endif
ifneq ($(strip $(IMAGES)),)
	docker rmi -f $(IMAGES)
endif

vclean :
ifneq ($(strip $(VOLUMES)),)
	docker volume rm $(VOLUMES)
endif
	rm -rf ./back/postgres

prune :
	echo y | docker system prune -a

logs :
	docker-compose logs

make_dir :
			mkdir -p postgres
# mkdir -p pgadmin

# docker-compose -f docker-compose.yml down; docker rm $(docker ps -qa); 
# docker rmi -f $(docker images -qa); docker volume rm $(docker volume ls -q);