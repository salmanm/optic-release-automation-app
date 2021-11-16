'use strict'

const Fastify = require('fastify')

const fastify = Fastify({
  logger: true,
})

const config = require('./lib/config')

fastify
  .register(require('./lib/routes'), config)
  .register(require('./lib/github'), config)

fastify.listen(config.PORT, '0.0.0.0')
