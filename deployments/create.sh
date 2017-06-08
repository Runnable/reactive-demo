#!/bin/bash

ns="$1"
kubectl create namespace $ns

# apply services
kubectl --namespace=$ns apply -f ./services/frontend.yml
kubectl --namespace=$ns apply -f ./services/rabbit.yml
kubectl --namespace=$ns apply -f ./services/redis.yml

# apply deployments
kubectl --namespace=$ns apply -f ./rabbit.yml
kubectl --namespace=$ns apply -f ./redis.yml
kubectl --namespace=$ns apply -f ./frontend.yml
kubectl --namespace=$ns apply -f ./emailer.yml
kubectl --namespace=$ns apply -f ./parser.yml
kubectl --namespace=$ns apply -f ./db.yml
