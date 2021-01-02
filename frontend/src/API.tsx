let userJwt = window.localStorage.getItem('userJwt');

export default {
  fetch: async function(resource: string, init: any = {}) {
    if (!init.headers) {
      init.headers = {};
    }
    if (!init.headers.hasOwnProperty('Authorization') && userJwt) {
      init.headers.Authorization = `Bearer ${userJwt}`;
    }
    return await fetch(resource, init);
  },
  login: async function(username: string, password: string) {
    const res = await fetch('/api/v0/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({username, password}),
    });
    try {
      const data = await res.json();
      if (!data || !data.jwt) {
        return false;
      }
      userJwt = data.jwt;
      window.localStorage.setItem('userJwt', userJwt || '');
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  },
};
