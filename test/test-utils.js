import stream from 'node:stream'

export function makeHttpObjects (url, body) {
  const req = stream.Readable.from([body])
  req.url = url
  req.headers = { host: 'example.com' }

  const res = {
    body: '',
    headers: {},
    isDone: false,
    setHeader: (name, content) => { res.headers[name] = content },
    write: (str) => { res.body = str },
    end: () => { res.isDone = true }
  }

  return { req, res }
}
