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
};
