'use strict'

const fp = require('fastify-plugin')
const httpErrors = require('http-errors')

async function authPlugin(app) {
  app.addHook('onRequest', async req => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new httpErrors.Unauthorized()
    }
    const [, githubToken] = githubTokenMatch

    const { repo, owner } = await app.github.getRepoDetails(githubToken)

    req.auth = { repo, owner }
  })
}

module.exports = fp(authPlugin, {
  name: 'auth-plugin',
  dependencies: ['github-plugin'],
})
