all:
	hugo
	docker build -t patrickliportfolio . 
