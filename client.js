import { Accounts } from 'meteor/accounts-base';
import _ from 'lodash';
import { OnetimePass } from './common/otp.js';
import './common/OTPToken.js';

_.assign(OnetimePass, {

  /**
   * @callback loginCB
   * @param {object} error
   */

  /**
   * Attempt a full token login
   *
   * @param {string} OTPToken - generated by generateOTPToken
   * @param {loginCB} cb
   */
  loginWithToken (OTPToken, cb) {
    const loginRequest = {'oneTimePass.OTPToken': OTPToken};

    Accounts.callLoginMethod({
      methodArguments: [loginRequest],
      userCallback: cb
    });
  }
});

export { OnetimePass };