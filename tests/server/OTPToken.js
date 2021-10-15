const when = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365);

Tinytest.add(
  'onetime-pass - setDefaultExpirationInSeconds',
  function (test) {
    let expiration = 10
    OnetimePass.setDefaultExpirationInSeconds(expiration)
    token = new OnetimePass.OTPToken({hashedToken: 'a', when })
    test.equal(token.getExpirationInSeconds(), expiration)
  }
);

Tinytest.add(
  'onetime-pass - types work',
  function (test) {
    let month = 30 * 24 * 60 * 60;
    OnetimePass.setTypes({
      short: {expirationInSeconds: 10 * 60},
      long: {expirationInSeconds: month}
    });
    token = new OnetimePass.OTPToken({hashedToken: 'a', when, type: 'long'});
    test.equal(token.getExpirationInSeconds(), month);
  }
);

Tinytest.add(
  'onetime-pass - per-token expiration is retrieved correctly',
  function (test) {
    let month = 30 * 24 * 60 * 60;
    token = new OnetimePass.OTPToken({hashedToken: 'a', when, expirationInSeconds: month});
    test.equal(token.getExpirationInSeconds(), month);
    test.isTrue(token.isExpired);
  }
);

// TODO this one is flaky, should succeed after hitting rerun button
Tinytest.addAsync(
  'onetime-pass - old tokens are cleared',
  function (test, done) {
    try {
      Accounts.createUser({email: 'a@b', password: 'a'});
    } catch(e) { }

    let user = Meteor.users.findOne();
    OnetimePass.generateOTPToken(user._id, {expirationInSeconds: 0});
    Meteor.setTimeout(function() {
      OnetimePass._expireTokens();
      Meteor.setTimeout(function(){
        console.log('user.services', user.services);
        console.log('user', user);
        console.log('Meteor.users.findOne(user._id)', Meteor.users.findOne(user._id));
        let beforeCount = user.services.oneTimePassword ? user.services.oneTimePassword.tokens.length : 0;
        const afterUser = Meteor.users.findOne(user._id);
        let afterCount = afterUser.services.oneTimePassword.tokens.length;
        test.equal(beforeCount, afterCount); // one added, one cleaned up
        done();
      }, 2000);

    }, 3000);
  }
);
