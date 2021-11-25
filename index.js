'use strict'

const Fastify = require('fastify')

const fastify = Fastify({
  logger: true,
})

const config = require('./lib/config')

fastify
  .register(require('./lib/github'), config)
  .register(require('./lib/auth'), config)
  .register(require('./lib/routes'), config)

fastify.listen(config.PORT, '0.0.0.0')
