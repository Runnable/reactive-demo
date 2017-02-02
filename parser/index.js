const Ponos = require('ponos')
const Publisher = require('ponos/lib/rabbitmq')
const joi = require('joi')

/**
 * Responds to received comment event by emitting comment.normalize
 * @param  {Object} job
 * @return {Promise}
 */
const commentReceived = (job) => {
  return Promise.resolve().then(() => {
    publisher.publishTask('comment.normalize', {
      version: 'v1',
      comment: job.comment,
      from: job.from
    })
  })
}

/**
 * Truncates comment to 100 character.
 * If string has HATE in it, emit an error
 * Publish comment.normalized with normalized data
 * @param  {Object} job
 * @return {Promise}
 */
const normalizeComment = (job) => {
  return Promise.resolve().then(() => {
    if (job.comment.toUpperCase().includes('HATE')) {
      return publisher.publishEvent('comment.normalize.errored', {
        version: 'v1',
        comment: job.comment,
        errorMessage: 'hate is not allowed',
        from: job.from
      })
    }
    const normalizedComment = job.comment.substring(0, 100)
    publisher.publishEvent('comment.normalized', {
      version: 'v1',
      comment: normalizedComment
    })
  })
}

// Servers
const publisher = new Publisher({
  name: 'parser',
  events: [{
    name: 'comment.normalized',
    jobSchema: joi.object({
      comment: joi.string().required()
    }).unknown().required()
  },
    'comment.normalize.errored'
  ],
  tasks: [{
    name: 'comment.normalize',
    jobSchema: joi.object({
      comment: joi.string().required()
    }).unknown().required()
  }]
})

const ponos = new Ponos.Server({
  name: 'parser',
  events: {
    'comment.received': {
      task: commentReceived,
      joiSchema: joi.object({
        version: 'v1',
        comment: joi.string().required(),
        from: joi.string().required()
      }).unknown().required()
    }
  },
  tasks: {
    'comment.normalize': {
      task: normalizeComment,
      joiSchema: joi.object({
        version: 'v1',
        comment: joi.string().required()
      }).unknown().required()
    }
  }
})

publisher.connect()
.then(() => {
  return ponos.start()
})
.catch((err) => {
  console.log('Error starting service', err)
  process.exit(1)
})
