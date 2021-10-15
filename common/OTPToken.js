import _ from 'lodash';

class OTPToken {

  constructor(token) {
    if (!token.hashedToken || !token.when)
      throw new Meteor.Error('onetime-pass error: access token is missing a field');

    _.assign(this, token);
  }

  get typeConfig() {
    let config;

    if (this.type)
      config = OnetimePass._OTPTokenTypes[this.type];

    return config || {};
  }

  getExpirationInSeconds() {
    return this.expirationInSeconds ||
      this.typeConfig.expirationInSeconds ||
      OnetimePass._defaultExpirationInSeconds;
  }

  get expiresAt() {
    let expirationInMilliseconds = this.getExpirationInSeconds() * 1000;
    return this.when.getTime() + expirationInMilliseconds;
  }

  get isExpired() {
    return this.expiresAt < Date.now();
  }

  get expirationReason() {
    let reason = "This access token (type '"
          + this.type
          + "') has a "
          + this.getExpirationInSeconds()
          + '-second expiry, and expired at '
          + new Date(this.expiresAt);
    return reason;
  }
}

OnetimePass.OTPToken = OTPToken;
