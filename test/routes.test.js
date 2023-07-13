import test from 'node:test'
import assert from 'node:assert/strict'

import * as routes from '../src/routes.js'

const makeUrl = (path) => new URL(`http://buspackets.dev/${path}`)

test('static file handler', async () => {
  await test('it returns the BAD REQUEST handlers when given a non-GET method', () => {
    const url = makeUrl('index.html')
    const handler = routes.getHandler(url, 'POST', false)
    assert.equal(handler.name, 'serveBadRequest')
  })

  await test('it returns the NOT FOUND handler when static files are turned off', () => {
    const url = makeUrl('index.html')
    const handler = routes.getHandler(url, 'GET', false)
    assert.equal(handler.name, 'serveNotFound')
  })

  await test('it returns the static file handler when static files are turned on', () => {
    const url = makeUrl('index.html')
    const handler = routes.getHandler(url, 'GET', true)
    assert.equal(handler.name, '')
  })
})

test('api routing', async () => {
  await test('it returns the "get" method for supported GET requests', () => {
    const url = makeUrl('api/packets')
    const handler = routes.getHandler(url, 'GET', true)
    assert.equal(handler.name, 'get')
  })

  await test('it returns the "post" method for supported POST requests', () => {
    const url = makeUrl('api/packets')
    const handler = routes.getHandler(url, 'POST', true)
    assert.equal(handler.name, 'post')
  })

  await test('it returns the "del" method for supported DELETE requests', () => {
    const url = makeUrl('api/packets')
    const handler = routes.getHandler(url, 'DELETE', true)
    assert.equal(handler.name, 'del')
  })

  await test('it returns NOT ALLOWED for unsupported method requests', () => {
    const url = makeUrl('api/stops')
    const handler = routes.getHandler(url, 'DELETE', true)
    assert.equal(handler.name, 'serveNotAllowed')
  })
})
