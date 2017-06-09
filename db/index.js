const Ponos = require('ponos')
const Publisher = require('ponos/lib/rabbitmq')
const joi = require('joi')
const redis = require('redis').createClient({
  host: process.env.REDIS_HOST || 'localhost'
})

/**
 * Responds to normalized comment event by emitting comment.save
 * @param  {Object} job
 * @return {Promise}
 */
const commentNormalized = (job) => {
  return Promise.resolve().then(() => {
    publisher.publishTask('comment.save', {
      version: 'v1',
      comment: job.comment
    })
  })
}

/**
 * Saves comment in database and emits event comment.update
 * with all of the comments in the database.
 * @param  {Object} job
 * @return {Promise}
 */
const saveComment = (job) => {
  return new Promise((resolve, reject) => {
    redis.lpush('comments', job.comment, (err) => {
      if (err) { return reject(err) }

      getDataAndEmitUpdateEvent(resolve, reject)
    })
  })
}

/**
 * Emits event comment.update
 * with all of the comments in the database. We also send
 * a count so consumers know the latest data.
 * @param  {Object} job
 * @return {Promise}
 */
const userConnected = (job) => {
  return new Promise((resolve, reject) => {
    getDataAndEmitUpdateEvent(resolve, reject)
  })
}

const getDataAndEmitUpdateEvent = (resolve, reject) => {
  redis.lrange('comments', 0, -1, (err, comments) => {
    if (err) { return reject(err) }

    publisher.publishEvent('comments.updated', {
      version: 'v1',
      count: comments.length,
      comments: comments
    })
    resolve()
  })
}

// Schema
const commentSaveSchema = joi.object({
  version: 'v1',
  count: joi.number().required(),
  comment: joi.string().required()
}).unknown().required()

const commentSchema = joi.object({
  version: 'v1',
  comment: joi.string().required()
}).unknown().required()

const commentUpdatedSchema = joi.object({
  version: 'v1',
  count: joi.number().required(),
  comments: joi.array().items(joi.string()).required()
}).unknown().required()

// Worker and publisher
const ponos = new Ponos.Server({
  name: 'db',
  events: {
    'comment.normalized': {
      task: commentNormalized,
      joiSchema: commentSchema
    },
    'user.connected': {
      task: userConnected
    }
  },
  tasks: {
    'comment.save': {
      task: saveComment,
      joiSchema: commentSaveSchema
    }
  }
})

const publisher = new Publisher({
  name: 'db',
  events: [{
    name: 'comments.updated',
    jobSchema: commentUpdatedSchema
  }],
  tasks: [{
    name: 'comment.save',
    jobSchema: commentSchema
  }]
})

// Start app
publisher.connect()
.then(() => {
  return ponos.start()
})
.catch((err) => {
  console.log('Error starting service', err)
  process.exit(1)
})
