#!/bin/bash

docker run -it --rm --name prometheus --net host -v $PWD/prometheus-local.yml:/etc/prometheus/prometheus.yml prom/prometheus