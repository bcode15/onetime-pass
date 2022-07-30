Package.describe({
  name: 'bcode15:onetime-pass',
  version: '0.2.0',
  summary: 'One Time Passwords',
  git: 'https://github.com/bcode15/onetime-pass.git'
});

Package.onUse(function(api) {
  api.use(['ecmascript',
           'accounts-base',
           'mongo',
           'check']);

  api.mainModule('client.js', 'client');
  api.mainModule('server.js', 'server');

  api.export('OnetimePass');
});

Package.onTest(function(api) {
  api.use(['brucejo:onetime-pass',
           'ecmascript',
           'tinytest',
           'meteor-base',
           'accounts-password']);

  api.addFiles('tests/helpers.js');

  api.addFiles(['tests/server/helpers.js',
                'tests/server/OTPToken.js'], 'server');

  api.addFiles(['tests/client/helpers.js',
                'tests/client/loginHandler.js'], 'client');
});
