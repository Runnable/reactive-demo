const path = require('path')
const http = require('http')
const Primus = require('primus')
const Publisher = require('ponos/lib/rabbitmq')
const joi = require('joi')
const fs = require('fs')
const Ponos = require('ponos')

const index = fs.readFileSync(path.join(__dirname, '/index.html'))
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'})
  res.end(index)
})
const primus = new Primus(server)

const connections = {}

// websocket actions
primus.on('connection', function (spark) {
  publisher.publishEvent('user.connected', {})
  spark.on('data', (data) => {
    publisher.publishEvent('comment.received', {
      version: 'v1',
      comment: data.comment,
      from: spark.id
    })
  })

  spark.on('end', (data) => {
    delete connections[spark.id]
  })

  connections[spark.id] = {
    count: 0,
    spark: spark
  }
})

// Workers
const commentReceived = (job) => {
  return Promise.resolve().then(() => {
    Object.keys(connections).forEach((sparkId) => {
      const connection = connections[sparkId]
      if (job.count > connection.count) {
        connection.count = job.count

        connection.spark.write({
          isError: false,
          data: {
            comments: job.comments
          }
        })
      }
    })
  })
}

const commentNormalizeErrored = (job) => {
  return Promise.resolve().then(() => {
    const connection = connections[job.from]

    connection.spark.write({
      isError: true,
      data: job
    })
  })
}

// Worker and publisher
const publisher = new Publisher({
  name: 'frontend',
  events: [{
    name: 'comment.received',
    jobSchema: joi.object({
      comment: joi.string().required()
    }).unknown().required()
  },
  'user.connected'
  ]
})

const ponos = new Ponos.Server({
  name: 'frontend',
  events: {
    'comments.updated': {
      task: commentReceived,
      joiSchema: joi.object({
        version: 'v1',
        comment: joi.string().required()
      }).unknown().required()
    },
    'comment.normalize.errored': {
      task: commentNormalizeErrored,
      joiSchema: joi.object({
        version: 'v1',
        errorMessage: joi.string().required(),
        comment: joi.string().required()
      }).unknown().required()
    }
  }
})

// Start App
publisher.connect()
.then(() => {
  return ponos.start()
})
.then(() => {
  server.listen(process.env.PORT)
})
.catch((err) => {
  console.log('Error starting service', err)
  process.exit(1)
})
