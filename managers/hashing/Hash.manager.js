const crypto    = require("crypto");
module.exports  = class Hasher {
  constructor({ config }) {
    this.config = config;
  }
  encrypt(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
  }
  compare(password, hash) {
    return this.encrypt(password) === hash;
  }
};