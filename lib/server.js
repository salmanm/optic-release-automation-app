'use strict'

const fetch = require('node-fetch')
const httpErrors = require('http-errors')
const S = require('fluent-json-schema')
const { Octokit } = require('@octokit/rest')

const { createAppJWT } = require('./github')

const schema = {
  body: S.object(),
  // .prop('pullRequestNumber', S.number().required())
  // .prop('approveOnly', S.boolean().default(false))
  // .prop('excludePackages', S.array().items(S.string()).default([]))
  // .prop('approveComment', S.string())
  // .prop('mergeMethod', S.string().default('squash')),
}

async function getInstallationRepositories(token) {
  const res = await fetch('https://api.github.com/installation/repositories', {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      authorization: `token ${token}`,
    },
  })

  const json = await res.json()

  // assert(res.ok, JSON.stringify(json))

  return json.repositories
}

async function getRepositoryInstallation(owner, repo, appJWT) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/installation`,
    {
      headers: {
        accept: 'application/vnd.github.v3+json',
        authorization: `bearer ${appJWT}`,
      },
    }
  )

  const json = await res.json()

  // assert(res.ok, JSON.stringify(json))

  return json
}

async function createInstallationAccessToken(installation, appJWT) {
  const res = await fetch(installation.access_tokens_url, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github.v3+json',
      authorization: `bearer ${appJWT}`,
    },
  })

  const json = await res.json()

  // assert(res.ok, JSON.stringify(json))

  return json
}

module.exports = async (fastify, options) => {
  fastify.get('/', async () => ({ hello: 'world' }))

  fastify.post('/', { schema }, async (req, reply) => {
    const githubTokenMatch = /token (.+)$/i.exec(req.headers.authorization)

    if (!githubTokenMatch || !githubTokenMatch[1]) {
      throw new httpErrors.Unauthorized()
    }

    const [, githubToken] = githubTokenMatch

    const [repository] = await getInstallationRepositories(githubToken)

    const {
      name: repo,
      owner: { login: owner },
    } = repository

    const appJWT = createAppJWT(options.APP_ID, options.PRIVATE_KEY)

    const installation = await getRepositoryInstallation(owner, repo, appJWT)

    const { token: accessToken } = await createInstallationAccessToken(
      installation,
      appJWT
    )

    const { head, base, title, body } = req.body

    const github = new Octokit({ auth: accessToken })

    await github.rest.pulls.create({ owner, repo, head, base, title, body })

    reply.send()
  })
}
