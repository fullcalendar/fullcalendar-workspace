
export class JsonRequestError extends Error {
  constructor(message, response) {
    super(message);
    this.response = response;
  }
}

export function requestJson(method, url, params) {
  method = method.toUpperCase();
  const fetchOptions = {
    method,
  };
  if (method === 'GET') {
    url += (url.indexOf('?') === -1 ? '?' : '&') +
      new URLSearchParams(params);
  }
  else {
    fetchOptions.body = new URLSearchParams(params);
    fetchOptions.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }
  return fetch(url, fetchOptions).then((fetchRes) => {
    if (fetchRes.ok) {
      return fetchRes.json().then((parsedResponse) => {
        return [parsedResponse, fetchRes];
      }, () => {
        throw new JsonRequestError('Failure parsing JSON', fetchRes);
      });
    }
    else {
      throw new JsonRequestError('Request failed', fetchRes);
    }
  });
}

export function identity(raw) {
  return raw;
}
