'use strict'

const fp = require('fastify-plugin')
const httpErrors = require('http-errors')
const S = require('fluent-json-schema')

const schema = {
  body: S.object()
    .additionalProperties(false) // important
    .prop('head', S.string().required())
    .prop('base', S.string().required())
    .prop('title', S.string().required())
    .prop('body', S.string().required()),
}

async function routesPlugin(app, options) {
  app.get('/healthcheck', async () => ({ ok: true }))

  app.post('/', { schema }, async (req, reply) => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new httpErrors.Unauthorized()
    }

    const [, githubToken] = githubTokenMatch

    const { repo, owner } = await app.github.getRepoDetails(githubToken)

    const accessToken = await app.github.getAccessToken(owner, repo, options)

    await app.github.createPR({ ...req.body, owner, repo }, accessToken)

    reply.send()
  })
}

module.exports = fp(routesPlugin, {
  name: 'routes-plugin',
})
