#!/bin/bash

ns="$1"

kubectl delete namespace $ns

# delete services
kubectl --namespace=$ns delete -f ./services/frontend.yml
kubectl --namespace=$ns delete -f ./services/rabbit.yml
kubectl --namespace=$ns delete -f ./services/redis.yml

# delete deployments
kubectl --namespace=$ns delete -f ./rabbit.yml
kubectl --namespace=$ns delete -f ./redis.yml
kubectl --namespace=$ns delete -f ./frontend.yml
kubectl --namespace=$ns delete -f ./emailer.yml
kubectl --namespace=$ns delete -f ./parser.yml
kubectl --namespace=$ns delete -f ./db.yml
