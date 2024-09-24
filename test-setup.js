import Fastify from 'fastify'
import routes from './lib/routes.js';

const config = {
  PRIVATE_KEY: 'pk-pk',
  APP_ID: '1122',
}

export default async function (fn = s => s) {
  const app = Fastify({ logger: false })

  app.register(routes, config)

  await fn(app)
  await app.ready()

  return app
}
