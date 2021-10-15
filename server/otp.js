import _ from 'lodash';

Meteor.users._ensureIndex(
  {'services.oneTimePassword.tokens.hashedToken': 1},
  {name: 'onetime-pass:services.oneTimePassword'});


_.assign(OnetimePass, {

  /**
   * Generate a token to send and later use for loginWithToken
   * @param {string|object} user
   * @param {object} opts - `{type: String}` or `{expirationInSeconds: Integer}`. Any additional fields in `opts` will be copied to the stored token that is provided to any hooks.
   */
  generateOTPToken(user, opts) {
    let stampedToken,
        hashStampedToken;

    check(user, Match.OneOf(String, Object), '`user` must be a string or basic object');
    check(opts, Match.Optional(Object));

    if ('string' === typeof user) {
      user = {_id: user};
    } else if ('object' !== typeof user) {
      throw new Error ("onetime-pass error: invalid user argument");
    }

    stampedToken = Accounts._generateStampedLoginToken();
    hashStampedToken = Accounts._hashStampedToken(stampedToken);

    if (opts) _.assign(hashStampedToken, opts);

    Meteor.users.update(user._id, {
      $push: {
        'services.oneTimePassword.tokens': hashStampedToken
      }
    });

    //console.log({hashStampedToken})

    return stampedToken.token
  }, // end generateOTPToken

  _lookupToken(token) {
    check(token, String)

    let hashedToken = Accounts._hashLoginToken(token)

    // $elemMatch projection doens't work on nested fields
    fields = {
      _id: 1,
      'services.oneTimePassword.tokens': 1
    }

    user = Meteor.users.findOne({
      'services.oneTimePassword.tokens.hashedToken': hashedToken
    }, {fields})

    if (!user)
      throw new Meteor.Error('oneTimePass.token-not-found')

    let savedToken = _.find(user.services.oneTimePassword.tokens, {hashedToken})
    let OTPToken = new OnetimePass.OTPToken(savedToken)

    if (OTPToken.isExpired)
      throw new Meteor.Error('oneTimePass.token-expired',
                             OTPToken.expirationReason)

    return {user, savedToken}
  } // end _lookupToken

}) // end _.assign(OnetimePass, ...)