import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { OnetimePass } from '../common/otp.js';
import _ from 'lodash';

Accounts.registerLoginHandler(function (loginRequest) {
  const token = loginRequest['oneTimePass.OTPToken'];

  if (!token) return undefined; // don't handle

  const { user } = OnetimePass._lookupToken(token);

  return { userId: user._id, type: 'OTP' };
});

/**
 * Once logged in
 * morph oneTimePassword.tokens to:
 * {
 *  deviceID: <id of the device logged in>
 *  expire: <date of otp expiration>
 *  storedToken: <resume hashedToken for this otp>
 * }
 */
Accounts.onLogin((data) => {
  if (data.type !== 'OTP') return;
  const passedToken = data.methodArguments[0]['oneTimePass.OTPToken'];
  const otpStampedToken = Accounts._hashLoginToken(passedToken);
  const resumeStampedToken = Accounts._getLoginToken(data.connection.id);
  if (!passedToken || !otpStampedToken || !resumeStampedToken) {
    Meris.log.error('Bad data for morphing onTimePassword.tokens');
    return;
  }

  // the passed data.user object does not have up to date data, need to requery
  const _id = data.user._id;
  const user = Meteor.users.findOne({ _id }, { fields: { 'services.resume': 1 } });
  const loginToken = _.find(user?.services?.resume?.loginTokens, { hashedToken: resumeStampedToken });
  const expire = loginToken?.when && loginToken.when.setDate(loginToken.when.getDate() + 90);
  if (!expire) {
    Meris.log.error('Expiration cannot be calculated');
    return;
  }
  Meteor.users.update(
    { _id, 'services.oneTimePassword.tokens.hashedToken': otpStampedToken },
    {
      $set: {
        'services.oneTimePassword.tokens.$.expire': new Date(expire),
        'services.oneTimePassword.tokens.$.storedToken': resumeStampedToken
      },
      $unset: {
        'services.oneTimePassword.tokens.$.hashedToken': '',
        'services.oneTimePassword.tokens.$.when': ''
      }
    }
  );
});

/**
 * Remove any oneTimePassword tokens that are not
 * connected to resume tokens
 * eg services.oneTimePassword.tokens.storedToken !== services.resume.loginTokens.hashedToken
 * This will leave oneTimePassword tokens in place that have not
 * logged in yet
 */
Accounts.onLogout((data) => {
  const OTPTokens = _.get(data.user, 'services.oneTimePassword.tokens');
  if (!OTPTokens) return;
  const resumeTokens = _.get(data.user, 'services.resume.loginTokens') || [];
  // get all the disconnected OTP tokens
  const noResumeIds = OTPTokens.reduce((nri, OTPToken) => {
    const hashedToken = OTPToken.storedToken;
    if (hashedToken && !_.find(resumeTokens, { hashedToken })) nri.push(hashedToken);
    return nri;
  }, []);
  // pull out all the unmatched
  Meteor.users.update(
    { _id: data.user._id },
    {
      $pull: {
        'services.oneTimePassword.tokens': { storedToken: { $in: noResumeIds } }
      }
    }
  );
});
