const nodemailer = require('nodemailer')
const Ponos = require('ponos')
const joi = require('joi')

const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail'
})

/**
 * Responds to received comment event by sending an email
 * @param  {Object} job
 * @return {Promise}
 */
const commentReceived = (job) => {
  console.log('sending email for', job)

  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: 'djfaze@thebestmusic.com',
      to: process.env.EMAIL_ADDR,
      subject: 'Message',
      text: 'Thank you for your comment: \n ' + job.comment
    }, (err, info) => {
      if (err) { return reject(err) }
      console.log(info.envelope)
      console.log(info.messageId)
      resolve()
    })
  })
}

// worker server
const ponos = new Ponos.Server({
  name: 'emailer',
  events: {
    'comment.received': {
      task: commentReceived,
      joiSchema: joi.object({
        version: 'v1',
        comment: joi.string().required()
      }).unknown().required()
    }
  }
})

// start server
ponos.start()
.catch((err) => {
  console.log('Error starting service', err)
  process.exit(1)
})
