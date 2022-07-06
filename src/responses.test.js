import test from 'node:test'
import assert from 'node:assert/strict'
import * as responses from './responses.js'
import { IncomingMessage, ServerResponse } from 'node:http'

test('serveNoContent', () => {
  const res = new ServerResponse(new IncomingMessage())
  responses.serveNoContent(res)
  assert.equal(res.statusCode, 204)
})
