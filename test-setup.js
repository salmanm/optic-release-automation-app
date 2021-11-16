'use strict'

const Fastify = require('fastify')

const config = {
  PRIVATE_KEY: 'pk-pk',
  APP_ID: '1122',
}

module.exports = async function (fn = s => s) {
  const app = Fastify({ logger: false })

  app.register(require('./lib/routes'), config)

  await fn(app)
  await app.ready()

  return app
}
