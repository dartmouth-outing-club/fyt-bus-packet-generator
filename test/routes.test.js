import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import * as routes from '../src/routes.js'

const makeUrl = (path) => new URL(`http://buspackets.dev/${path}`)

describe('static file handler', () => {
  it('it returns the BAD REQUEST handlers when given a non-GET method', () => {
    const url = makeUrl('static/favicon.icon')
    const handler = routes.getHandler(url, 'POST', false)
    assert.equal(handler.name, 'serveBadRequest')
  })

  it('it returns the static file handler when static files are turned on', () => {
    const url = makeUrl('static/favicon.icon')
    const handler = routes.getHandler(url, 'GET', true)
    assert.equal(handler.name, '')
  })
})

describe('api routing', () => {
  it('it returns the "get" method for supported GET requests', () => {
    const url = makeUrl('packets')
    const handler = routes.getHandler(url, 'GET', true)
    assert.equal(handler.name, 'get')
  })

  it('it returns the "post" method for supported POST requests', () => {
    const url = makeUrl('packets')
    const handler = routes.getHandler(url, 'POST', true)
    assert.equal(handler.name, 'post')
  })

  it('it returns the "del" method for supported DELETE requests', () => {
    const url = makeUrl('packets')
    const handler = routes.getHandler(url, 'DELETE', true)
    assert.equal(handler.name, 'del')
  })

  it('it returns NOT ALLOWED for unsupported method requests', () => {
    const url = makeUrl('stops')
    const handler = routes.getHandler(url, 'DELETE', true)
    assert.equal(handler.name, 'serveNotAllowed')
  })
})
