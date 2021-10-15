window.Meteor = Meteor


let _createUserAndToken = function(opts, cb) {
  localStorage.clear();
  Meteor.call('cleardb');
  Accounts.createUser({
    email: 'a@b',
    password: 'a'
  }, function(){
    let userId = Meteor.userId()
    Meteor.logout(function() {
      Meteor.call('generateToken', userId, opts, function(e, token) {
        cb(userId, token)
      });
    });
  });
};

createUserAndToken = function(cb) {
  _createUserAndToken({}, cb);
};

createUserAndExpiringToken = function(cb) {
  _createUserAndToken({expirationInSeconds: 1}, cb);
};
