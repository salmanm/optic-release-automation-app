'use strict'

const httpErrors = require('http-errors')
const S = require('fluent-json-schema')

const github = require('./github')

const schema = {
  body: S.object()
    .additionalProperties(false) // important
    .prop('head', S.string().required())
    .prop('base', S.string().required())
    .prop('title', S.string().required())
    .prop('body', S.string().required()),
}

module.exports = async (fastify, options) => {
  fastify.get('/', async () => ({ hello: 'world' }))

  fastify.post('/', { schema }, async (req, reply) => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new httpErrors.Unauthorized()
    }

    const [, githubToken] = githubTokenMatch

    const { repo, owner } = await github.getRepoDetails(githubToken)
    const accessToken = await github.getAccessToken(owner, repo, options)

    await github.createPR({ ...req.body, owner, repo }, accessToken)

    reply.send()
  })
}
