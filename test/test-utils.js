export function makeHttpObjects (url) {
  const req = {
    url,
    headers: { host: 'example.com' }
  }

  const res = {
    body: '',
    headers: {},
    isDone: false,
    setHeader: (name, content) => { res.headers[name] = content },
    write: (str) => { res.body = str },
    end: () => res.isDone = true
  }

  return { req, res }
}


