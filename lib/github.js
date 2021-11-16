'use strict'

const fp = require('fastify-plugin')
const { Octokit } = require('@octokit/rest')
const jwt = require('jsonwebtoken')

const EXPIRE_IN_MINS = 10 * 60

async function githubPlugin(app, options) {
  function createAppJWT(appId, privateKey) {
    const now = Math.floor(Date.now() / 1000)

    const appToken = jwt.sign(
      { iat: now, exp: now + EXPIRE_IN_MINS, iss: appId },
      privateKey,
      { algorithm: 'RS256' }
    )

    return appToken
  }

  async function getRepoDetails(token) {
    const github = new Octokit({ auth: token })

    const data = await github.rest.apps.listReposAccessibleToInstallation()

    const [repository] = data.repositories

    return {
      repo: repository.name,
      owner: repository.owner.login,
    }
  }

  async function getAccessToken(owner, repo) {
    const appJWT = createAppJWT(options.APP_ID, options.PRIVATE_KEY)
    const github = new Octokit({ auth: appJWT })

    const installation = await github.rest.apps.getRepoInstallation({
      owner,
      repo,
    })

    const data = await github.rest.apps.createInstallationAccessToken({
      installation_id: installation.id,
    })

    return data.token
  }

  async function createPR(opts, token) {
    const github = new Octokit({ auth: token })
    return github.rest.pulls.create(opts)
  }

  const github = { getRepoDetails, getAccessToken, createPR }

  app.decorate('github', {
    getter() {
      return github
    },
  })
}

module.exports = fp(githubPlugin, {
  name: 'github-plugin',
})
