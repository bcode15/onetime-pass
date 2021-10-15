Meteor.methods({

  cleardb() {
    Meteor.users.remove({});
  },

  whoami() {
    l('whoami: ', Meteor.userId());
    return Meteor.userId();
  },

  generateToken(userId, opts) {
    return OnetimePass.generateOTPToken(userId, opts);
  }

})
