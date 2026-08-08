export const api = (path: string, init?: RequestInit) =>
  fetch('https://test1-z5nu.onrender.com/api/' + path.replace(/^\/+/, ''), init)
