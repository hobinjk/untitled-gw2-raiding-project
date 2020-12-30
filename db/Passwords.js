import bcrypt from 'bcrypt';

const saltRounds = 10;


export default {
  hash: function(str) {
    return bcrypt.hash(str, saltRounds);
  },
  compare: function(str, hash) {
    return bcrypt.compare(str, hash);
  },
};
