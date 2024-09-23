'use strict'

const fp = require('fastify-plugin')
const jwt = require('jsonwebtoken')
const httpErrors = require('http-errors')

const EXPIRE_IN_MINS = 10 * 60

async function githubPlugin(app, options) {
  function createAppJWT(appId, privateKey) {
    const now = Math.floor(Date.now() / 1000)

    const appToken = jwt.sign(
      { iat: now, exp: now + EXPIRE_IN_MINS, iss: appId },
      Buffer.from(privateKey, 'base64').toString(),
      { algorithm: 'RS256' }
    )

    return appToken
  }

  async function getRepoDetails(token) {
    const { Octokit } = await import('@octokit/rest')
    const github = new Octokit({ auth: token })

    const { data } = await github.rest.apps.listReposAccessibleToInstallation()

    const [repository] = data.repositories

    return {
      repo: repository.name,
      owner: repository.owner.login,
    }
  }

  async function getAccessToken(owner, repo) {
    const appJWT = createAppJWT(options.APP_ID, options.PRIVATE_KEY)
    const { Octokit } = await import('@octokit/rest')
    const github = new Octokit({ auth: appJWT })

    let installation
    try {
      const { data } = await github.rest.apps.getRepoInstallation({
        owner,
        repo,
      })

      installation = data
    } catch (err) {
      // App is not installed on the target repo
      if (err.status === 404) {
        throw httpErrors.NotFound()
      }
    }

    if (!installation) throw httpErrors.InternalServerError()

    const { data } = await github.rest.apps.createInstallationAccessToken({
      installation_id: installation.id,
    })

    return data.token
  }

  async function createPR(opts, token) {
    const { Octokit } = await import('@octokit/rest')
    const github = new Octokit({ auth: token })
    return github.rest.pulls.create(opts)
  }

  async function createDraftRelease(
    { owner, repo, version, target, name, generateReleaseNotes, releaseNotes },
    token
  ) {
    const { Octokit } = await import('@octokit/rest')
    const github = new Octokit({ auth: token })
    return github.rest.repos.createRelease({
      owner,
      repo,
      ...(name && { name }),
      tag_name: version,
      target_commitish: target,
      generate_release_notes: generateReleaseNotes,
      ...(releaseNotes && { body: releaseNotes }),
      draft: true,
    })
  }

  async function publishRelease(
    { owner, repo, version, releaseId, isPreRelease },
    token
  ) {
    const { Octokit } = await import('@octokit/rest')
    const github = new Octokit({ auth: token })
    return github.rest.repos.updateRelease({
      owner,
      repo,
      tag_name: version,
      generate_release_notes: true,
      release_id: releaseId,
      draft: false,
      prerelease: isPreRelease,
    })
  }

  const github = {
    getRepoDetails,
    getAccessToken,
    createPR,
    createDraftRelease,
    publishRelease,
  }

  app.decorate('github', {
    getter() {
      return github
    },
  })
}

module.exports = fp(githubPlugin, {
  name: 'github-plugin',
})
