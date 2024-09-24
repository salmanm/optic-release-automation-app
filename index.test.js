import { test } from 'node:test';
import assert from 'node:assert/strict';
import sinon from 'sinon';

import setup from './test-setup.js';

test('Ensure all imports used by index.js are correct', async t => {
  try {
    await import('./lib/github.js')
    await import('./lib/auth.js')
    await import('./lib/routes.js')
    
    assert.ok(true, 'all imports used by index.js import correctly')
    
  } catch (err) {
    assert.fail(`Failed to import files used by index.js: ${err.message}`, )
  }
})

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

  assert.equal(getAccessTokenStub.callCount, 1)
  assert.ok(getAccessTokenStub.calledWithExactly('salmanm', 'smn-repo'))

  assert.equal(createPRStub.callCount, 1)
  assert.ok(
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

  assert.equal(response.statusCode, 200)
})

test('create release with target specified', async t => {
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

  assert.equal(getAccessTokenStub.callCount, 1)
  assert.ok(getAccessTokenStub.calledWithExactly('salmanm', 'smn-repo'))

  assert.equal(createDraftReleaseStub.callCount, 1)
  assert.ok(
    createDraftReleaseStub.calledWithExactly(
      {
        version: 'v9.9.9',
        target: 'commit-hash',
        generateReleaseNotes: true,
        owner: 'salmanm',
        repo: 'smn-repo',
      },
      'some-token'
    )
  )

  assert.equal(response.statusCode, 200)
})

test('create release with no target specified', async t => {
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
      version: 'v9.9.9',
    }),
  })

  assert.equal(getAccessTokenStub.callCount, 1)
  assert.ok(getAccessTokenStub.calledWithExactly('salmanm', 'smn-repo'))

  assert.equal(createDraftReleaseStub.callCount, 1)
  assert.ok(
    createDraftReleaseStub.calledWithExactly(
      {
        version: 'v9.9.9',
        generateReleaseNotes: true,
        owner: 'salmanm',
        repo: 'smn-repo',
      },
      'some-token'
    )
  )

  assert.equal(response.statusCode, 200)
})

test('create release with releaseNotes specified', async t => {
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
      version: 'v9.9.9',
      generateReleaseNotes: true,
      releaseNotes: 'my release notes',
    }),
  })

  assert.equal(getAccessTokenStub.callCount, 1)
  assert.ok(getAccessTokenStub.calledWithExactly('salmanm', 'smn-repo'))

  assert.equal(createDraftReleaseStub.callCount, 1)
  assert.ok(
    createDraftReleaseStub.calledWithExactly(
      {
        version: 'v9.9.9',
        generateReleaseNotes: true,
        releaseNotes: 'my release notes',
        owner: 'salmanm',
        repo: 'smn-repo',
      },
      'some-token'
    )
  )

  assert.equal(response.statusCode, 200)
})

test('it publishes a prerelease successfully', async t => {
  const mockedRepo = { repo: 'smn-repo', owner: 'salmanm' }

  const getAccessTokenStub = sinon.stub().resolves('some-token')
  const publishReleaseStub = sinon.stub().resolves('some-token')

  const app = await setup(async server => {
    server.addHook('onRequest', async req => {
      req.auth = { ...mockedRepo }
    })
    server.decorate('github', {
      getAccessToken: getAccessTokenStub,
      publishRelease: publishReleaseStub,
    })
  })

  const response = await app.inject({
    method: 'PATCH',
    headers: {
      authorization: 'token gh-token',
      'content-type': 'application/json',
    },
    url: '/release',
    body: JSON.stringify({
      releaseId: '1',
      version: 'v9.9.9',
      isPreRelease: true,
    }),
  })

  assert.equal(getAccessTokenStub.callCount, 1)
  assert.ok(getAccessTokenStub.calledWithExactly('salmanm', 'smn-repo'))

  assert.equal(publishReleaseStub.callCount, 1)
  assert.ok(
    publishReleaseStub.calledWithExactly(
      {
        releaseId: '1',
        version: 'v9.9.9',
        isPreRelease: true,
        owner: 'salmanm',
        repo: 'smn-repo',
      },
      'some-token'
    )
  )

  assert.equal(response.statusCode, 200)
})
