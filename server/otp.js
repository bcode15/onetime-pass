import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { OnetimePass } from '../common/otp.js';
import _ from 'lodash';

Meteor.users._ensureIndex(
  { 'services.oneTimePassword.tokens.hashedToken': 1 },
  { name: 'onetime-pass:services.oneTimePassword' }
);

_.assign(OnetimePass, {
  /**
   * Generate a token to send and later use for loginWithToken
   *
   * @param {string|object} user
   * @param {object} opts - `{type: String}` or `{expirationInSeconds: Integer}`. Any additional fields in `opts` will be copied to the stored token that is provided to any hooks.
   * @returns {string} token
   */
  generateOTPToken(user, opts) {
    check(user, Match.OneOf(String, Object), '`user` must be a string or basic object');
    check(opts, Match.Optional(Object));

    if ('string' === typeof user) {
      user = { _id: user };
    } else if ('object' !== typeof user) {
      throw new Error('onetime-pass error: invalid user argument');
    }

    const stampedToken = Accounts._generateStampedLoginToken();
    const hashStampedToken = Accounts._hashStampedToken(stampedToken);

    if (opts) _.assign(hashStampedToken, opts);

    Meteor.users.update(user._id, {
      $push: {
        'services.oneTimePassword.tokens': hashStampedToken
      }
    });

    //console.log({hashStampedToken})

    return stampedToken.token;
  }, // end generateOTPToken

  clearAllTokens(user) {
    check(user, Match.OneOf(String, Object), '`user` must be a string or basic object');

    if ('string' === typeof user) {
      user = { _id: user };
    } else if ('object' !== typeof user) {
      throw new Error('onetime-pass error: invalid user argument');
    }

    Meteor.users.update(user._id, {
      $set: {
        'services.oneTimePassword': { tokens: [] },
        'services.resume': { loginTokens: [] }
      }
    });
  },

  _lookupToken(token) {
    check(token, String);

    const hashedToken = Accounts._hashLoginToken(token);

    // $elemMatch projection doens't work on nested fields
    const fields = {
      _id: 1,
      'services.oneTimePassword.tokens': 1
    };

    const user = Meteor.users.findOne(
      {
        'services.oneTimePassword.tokens.hashedToken': hashedToken
      },
      { fields }
    );

    if (!user) throw new Meteor.Error('oneTimePass.token-not-found');

    const savedToken = _.find(user.services.oneTimePassword.tokens, { hashedToken });
    const OTPToken = new OnetimePass.OTPToken(savedToken);

    if (OTPToken.isExpired) throw new Meteor.Error('oneTimePass.token-expired', OTPToken.expirationReason);

    return { user, savedToken };
  } // end _lookupToken
}); // end _.assign(OnetimePass, ...)
