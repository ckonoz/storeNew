var LocalStrategy = require('passport-local').Strategy;
var User = require('./server/models/user/model.js');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

var config = require('./config');

module.exports = function(passport) {


  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findOne({
      _id: id
    }, '-salt -hashed_password', function(err, user) {
      done(err, user);
    });
  });

  passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, done) {

      User.findOne({
        'email': email
      }, function(err, user) {
        if (err)
          return done(err);

        if (!user)
          return done('No user found.');

        if (!user.validPassword(password))
          return done('Oops! Wrong password.');

        return done(null, user);
      });

    }));

  passport.use('local-signup', new LocalStrategy(
    function(username, password, done) {
      var email = username;

      process.nextTick(function() {
        User.findOne({
          'email': email
        }, function(err, user) {
          if (err) {
            console.log(err);
            return done(err);
          }

          if (user) {
            console.log('this email was already in use');
            return done('This email was already in use.');
          } else {

            // if there is no user with that email
            // create the user
            var newUser = new User();

            newUser.email = email;
            newUser.password = newUser.generateHash(password);

            // save the user
            newUser.save(function(err, newUser) {
              if (err) {
                console.log(err);
                return done('There was a problem saving the user.');
              }
              console.log(newUser);
              return done(null, newUser);
            });
          }
        });
      });
    }));


  passport.use('facebook', new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL

    },
    function(token, refreshToken, profile, done) {

      process.nextTick(function() {
        User.findOne({
          'facebookId': profile.id
        }, function(err, user) {


          if (err) {
            console.log(err);
            return done(err);
          }

          if (user) {
            return done(null, user); // user found, return that user
          } else {
            var newUser = new User();
            var name = profile.displayName.split(' ');
            var firstName = name[0];
            var lastName = name[name.length - 1];

            newUser.facebookId = profile.id;
            newUser.facebookToken = token;
            newUser.facebookName = profile.name.displayName;
            newUser.firstname = firstName;
            newUser.lastname = lastName;

            if (profile.emails) {
              newUser.facebookEmail = profile.emails[0].value;
            }
            newUser.save(function(err) {
              if (err) {
                console.log(err);
                throw err;
              }
              return done(null, newUser);
            });
          }
        });
      });
    }));

  passport.use('twitter', new TwitterStrategy({
      consumerKey: config.twitter.consumerKey,
      consumerSecret: config.twitter.consumerSecret,
      callbackURL: config.twitter.callbackURL
    },
    function(token, tokenSecret, profile, done) {
      process.nextTick(function() {
        console.log('called');

        User.findOne({
          'twitterId': profile.id
        }, function(err, user) {
          if (err) {
            console.log(err);
            return done(err);
          }

          if (user) {
            return done(null, user); // user found, return that user
          } else {
            var newUser = new User();
            var name = profile.displayName.split(' ');
            var firstName = name[0];
            var lastName = name[name.length - 1];

            newUser.twitterId = profile.id;
            newUser.twitterToken = token;
            newUser.twitterUsername = profile.username;
            newUser.twitterDisplayName = profile.displayName;
            newUser.firstname = firstName;
            newUser.lastname = lastName;

            newUser.save(function(err) {
              if (err) {
                console.log(err);
                throw err;
              }
              return done(null, newUser);
            });
          }
        });
      });
    }));

};
