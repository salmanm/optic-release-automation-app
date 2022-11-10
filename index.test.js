'use strict'

const { test } = require('tap')
const sinon = require('sinon')

const setup = require('./test-setup')

test('create pr', async t => {
  const mockedRepo = { repo: 'smn-repo', owner: 'salmanm' }

  const getRepoDetailsStub = sinon.stub().resolves(mockedRepo)
  const getAccessTokenStub = sinon.stub().resolves('some-token')
  const createPRStub = sinon.stub().resolves({})

  const app = await setup(async server => {
    server.addHook('onRequest', async req => {
      req.auth = { ...mockedRepo }
    })
    server.decorate('github', {
      getRepoDetails: getRepoDetailsStub,
      getAccessToken: getAccessTokenStub,
      createPR: createPRStub,
    })
  })

  const response = await app.inject({
    method: 'POST',
    headers: {
      authorization: 'token gh-token',
      'content-type': 'application/json',
    },
    url: '/pr',
    body: JSON.stringify({
      head: 'head-branch',
      base: 'base-branch',
      title: 'pr-title',
      body: 'pr-body',
    }),
  })

  t.same(getAccessTokenStub.callCount, 1)
  t.ok(getAccessTokenStub.calledWithExactly('salmanm', 'smn-repo'))

  t.same(createPRStub.callCount, 1)
  t.ok(
    createPRStub.calledWithExactly(
      {
        head: 'head-branch',
        base: 'base-branch',
        title: 'pr-title',
        body: 'pr-body',
        owner: 'salmanm',
        repo: 'smn-repo',
      },
      'some-token'
    )
  )

  t.same(response.statusCode, 200)
})

test('create release', async t => {
  const mockedRepo = { repo: 'smn-repo', owner: 'salmanm' }

  const getAccessTokenStub = sinon.stub().resolves('some-token')
  const createDraftReleaseStub = sinon.stub().resolves('some-token')

  const app = await setup(async server => {
    server.addHook('onRequest', async req => {
      req.auth = { ...mockedRepo }
    })
    server.decorate('github', {
      getAccessToken: getAccessTokenStub,
      createDraftRelease: createDraftReleaseStub,
    })
  })

  const response = await app.inject({
    method: 'POST',
    headers: {
      authorization: 'token gh-token',
      'content-type': 'application/json',
    },
    url: '/release',
    body: JSON.stringify({
      target: 'commit-hash',
      version: 'v9.9.9',
    }),
  })

  t.same(getAccessTokenStub.callCount, 1)
  t.ok(getAccessTokenStub.calledWithExactly('salmanm', 'smn-repo'))

  t.same(createDraftReleaseStub.callCount, 1)
  t.ok(
    createDraftReleaseStub.calledWithExactly(
      {
        version: 'v9.9.9',
        target: 'commit-hash',
        owner: 'salmanm',
        repo: 'smn-repo',
      },
      'some-token'
    )
  )

  t.same(response.statusCode, 200)
})
