'use strict'

const fp = require('fastify-plugin')
const httpErrors = require('http-errors')
const S = require('fluent-json-schema')

const prSchema = {
  body: S.object()
    .additionalProperties(false) // important
    .prop('head', S.string().required())
    .prop('base', S.string().required())
    .prop('title', S.string().required())
    .prop('body', S.string().required()),
}

const createReleaseSchema = {
  body: S.object()
    .additionalProperties(false) // important
    .prop('version', S.string().required()),
}

const publishReleaseSchema = {
  body: S.object()
    .additionalProperties(false) // important
    .prop('releaseId', S.string().required())
    .prop('version', S.string().required()),
}

async function routesPlugin(app, options) {
  app.get('/healthcheck', async () => ({ ok: true }))

  app.post('/pr', { schema: prSchema }, async req => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new httpErrors.Unauthorized()
    }

    const [, githubToken] = githubTokenMatch

    const { repo, owner } = await app.github.getRepoDetails(githubToken)

    const accessToken = await app.github.getAccessToken(owner, repo, options)

    return app.github.createPR({ ...req.body, owner, repo }, accessToken)
  })

  app.post('/release', { schema: createReleaseSchema }, async req => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new httpErrors.Unauthorized()
    }

    const [, githubToken] = githubTokenMatch

    const { repo, owner } = await app.github.getRepoDetails(githubToken)

    const accessToken = await app.github.getAccessToken(owner, repo, options)

    return app.github.createDraftRelease(
      { ...req.body, owner, repo },
      accessToken
    )
  })

  app.patch('/release', { schema: publishReleaseSchema }, async req => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new httpErrors.Unauthorized()
    }

    const [, githubToken] = githubTokenMatch

    const { repo, owner } = await app.github.getRepoDetails(githubToken)

    const accessToken = await app.github.getAccessToken(owner, repo, options)

    return app.github.publishRelease({ ...req.body, owner, repo }, accessToken)
  })
}

module.exports = fp(routesPlugin, {
  name: 'routes-plugin',
})
