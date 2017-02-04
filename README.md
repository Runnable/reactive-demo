Reactive Demo
=============

This repo contains a demo stack for a reactive architecture.

# Architecture

## Services

### `./frontend`

#### Description
The front-end is responsible for serving the main web page.
It creates a websocket connection back to itself to pass messages.
When a user comments, it is emitted over the websocket connection to the app.
This app takes this and publishes the `comment.received` event to the #MessageBus
This app listens for `comments.updated` events and upon receiving one, published a message on the socket so the web page can update itself.

#### Environment Variables
* `PORT` set this to the port you want the service to serve from
* `RABBITMQ_HOSTNAME` the host address of your rabbitmq service

#### Running
```
PORT=80 npm start
```

### `./parser`

#### Description
The parser is a service which "normalizes" comments.
This app listens for `comment.received` events and upon receiving one it truncates the message to 100 characters and publishes the event `comment.normalized` with the truncated data.
If the comment has the word `hate` in it, it publishes the event `comment.normalize-error`.

#### Environment Variables
* `RABBITMQ_HOSTNAME` the host address of your rabbitmq service

#### Running
```
npm start
```

### `./db`

#### Description
The db is a service which saves comments.
This app listens for `comment.normalized` events and upon receiving one it saves the message into the database (currently redis)
After saving it publishes `comments.updated` event with all the comments in the database
It also listens for `user.connected` events and upon receiving one it publishes `comments.updated` event with all the comments in the database

#### Environment Variables
* `RABBITMQ_HOSTNAME` the host address of your rabbitmq service
* `REDIS_HOST` the host address of your redis service

#### Running
```
npm start
```

### `./emailer`

#### Description
The emailer is a service which sends emails.
This app listens for `comment.received` events and upon receiving one it it sends an email to the address defined by `EMAIL_ADDR`

#### Environment Variables
* `RABBITMQ_HOSTNAME` the host address of your rabbitmq service
* `EMAIL_ADDR` the email address to send emails to

#### Running
```
npm start
```

## Message bus
The message bus is RabbitMQ

## Data Store
The datastore is Redis

# Deploying

## Compose
There are 3 compose files.

* `docker-compose.yml` - Use to launch the entire application
* `docker-compose-local.yml` - Use to launch everything but front-end and rabbit
* `docker-compose-remote.yml` - Use to launch front-end and rabbit.

I split local and remote because `remote` should be launched on a server which everyone should have access to and `local` for services that do not need access.

## Kubernetes
The configuration files for Kubernetes live in `./deployments`
The files at the root of `deployments` are deploy files and the files in the `deployments/services` define all the k8 services.

## Docker
Every service has a `Dockerfile` at the root. Simply run `docker build .` to build docker images.
These docker images are also build on docker hub with the following format:

* runnable/reactive-demo:frontend
* runnable/reactive-demo:parser
* runnable/reactive-demo:db
* runnable/reactive-demo:emailer
