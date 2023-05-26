FROM halverneus/static-file-server:v1.8.9

COPY ./public /web

EXPOSE 8080
