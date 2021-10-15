OnetimePass = {

  _defaultExpirationInSeconds: 24 * 60 * 60, // 1 day

  setDefaultExpirationInSeconds(expiration) {
    this._defaultExpirationInSeconds = expiration;
  },

  _OTPTokenTypes: {},

  setTypes(types) {
    this._OTPTokenTypes = types;
  }
};

