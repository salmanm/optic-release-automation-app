import Fastify from 'fastify';

import githubRoutes from './lib/github.js'
import authRoutes from './lib/auth.js'
import routes from './lib/routes.js'

import config from './lib/config.js'

const fastify = Fastify({
  logger: true,
})


fastify
  .register(githubRoutes, config)
  .register(authRoutes, config)
  .register(routes, config)

fastify.listen({ port: config.PORT, host: '0.0.0.0' })

export default fastify
