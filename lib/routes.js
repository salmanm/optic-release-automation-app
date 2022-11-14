'use strict'

const fp = require('fastify-plugin')
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
    .prop('version', S.string().required())
    .prop('target', S.string()),
}

const publishReleaseSchema = {
  body: S.object()
    .additionalProperties(false) // important
    .prop('releaseId', S.string().required())
    .prop('version', S.string().required()),
}

async function routesPlugin(app) {
  app.post('/pr', { schema: prSchema }, async req => {
    const { owner, repo } = req.auth
    const accessToken = await app.github.getAccessToken(owner, repo)

    return app.github.createPR({ ...req.body, owner, repo }, accessToken)
  })

  app.post('/release', { schema: createReleaseSchema }, async req => {
    const { owner, repo } = req.auth
    const accessToken = await app.github.getAccessToken(owner, repo)

    return app.github.createDraftRelease(
      { ...req.body, owner, repo },
      accessToken
    )
  })

  app.patch('/release', { schema: publishReleaseSchema }, async req => {
    const { owner, repo } = req.auth
    const accessToken = await app.github.getAccessToken(owner, repo)

    return app.github.publishRelease({ ...req.body, owner, repo }, accessToken)
  })
}

module.exports = fp(routesPlugin, {
  name: 'routes-plugin',
})
