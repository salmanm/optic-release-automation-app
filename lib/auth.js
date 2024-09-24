import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

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

export default fp(authPlugin, {
  name: 'auth-plugin',
  dependencies: ['github-plugin'],
})
