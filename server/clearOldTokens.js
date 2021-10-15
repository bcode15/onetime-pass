OnetimePass._expireTokens = function() {
  Meteor.users.find({
    'services.oneTimePassword.tokens': {
      $exists: true,
      $ne: []
    }
  }).forEach(function(user) {
    for (let token of user.services.oneTimePassword.tokens) {
      OTPToken = new OnetimePass.OTPToken(token);
      if (OTPToken.isExpired) {
        Meteor.users.update(user._id, {
          $pull: {
            'services.oneTimePassword.tokens': {
              hashedToken: token.hashedToken
            }
          }
        });
      }
    }
  });
};

Meteor.setInterval(function() {
  OnetimePass._expireTokens()
}, 60 * 60 * 1000); // 1 hour
