'use strict'

const { test } = require('tap')
const sinon = require('sinon')

const setup = require('./test-setup')

test('healthcheck', async t => {
  const app = await setup()

  const response = await app.inject('/healthcheck')

  t.same(response.json(), { ok: true })
})

test('create pr', async t => {
  const mockedRepo = { repo: 'smn-repo', owner: 'salmanm' }

  const getRepoDetailsStub = sinon.stub().resolves(mockedRepo)
  const getAccessTokenStub = sinon.stub().resolves('some-token')
  const createPRStub = sinon.stub().resolves()

  const app = await setup(server => {
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

  t.same(getRepoDetailsStub.callCount, 1)
  t.ok(getRepoDetailsStub.calledWithExactly('gh-token'))

  t.same(getAccessTokenStub.callCount, 1)
  t.ok(
    getAccessTokenStub.calledWithExactly('salmanm', 'smn-repo', {
      PRIVATE_KEY: 'pk-pk',
      APP_ID: '1122',
    })
  )

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
