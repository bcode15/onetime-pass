Tinytest.addAsync(
  'onetime-pass - loginWithToken works',
  function (test, done) {
    createUserAndToken(function(targetId, token) {
      test.isNull(Meteor.userId());

      OnetimePass.loginWithToken(token, function (e) {
        // console.log('EEE', e)
        test.isUndefined(e);
        test.equal(Meteor.userId(), targetId);

        // created a resume token
        test.equal(typeof localStorage.getItem('Meteor.loginToken'), 'string');

        // also test server side of the connection
        Meteor.call('whoami', function(e, serverUserId) {
          test.equal(serverUserId, targetId);

          // resume should happen after reconnect
          Meteor.disconnect();

          existingHook = Meteor.connection.onReconnect
          Meteor.connection.onReconnect = function() {
            existingHook();

            test.equal(Meteor.userId(), targetId);

            Meteor.call('whoami', function(e, serverUserId) {
              test.equal(serverUserId, targetId);

              done();
            });
          }

          Meteor.reconnect();
        });
      })
    })
  }
);

Tinytest.addAsync(
  'onetime-pass - per-token expiration works',
  (test, done) => {
    createUserAndExpiringToken(function(targetId, token) {
      test.isNull(Meteor.userId());
      setTimeout(() => {
        OnetimePass.loginWithToken(token, function (e) {
          test.equal(e.error, "oneTimePass.token-expired")
          test.isNull(Meteor.userId())
          done()
        });
      }, 2000);
    });
  }
);
