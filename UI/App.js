const express = require("express");
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const refresh = require('passport-oauth2-refresh');
const util = require('util');
const { ensureLoggedIn } = require('connect-ensure-login');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const request = require('request');

dotenv.load();


var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

app.use(session(
  {
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
  }));

app.use(passport.initialize());
app.use(passport.session());


//Phase 2: Your application will redirect the user to the Authorization Server for login
//Phase 3: The end user will login to the Authorization Server
app.get('/oauth/login', passport.authenticate('oauth2', {
  session: true,
  successReturnToOrRedirect: '/'
}));

//Phase 4: The Authorization Server will send Authorization Code to your applications redirect_uri
//Phase 5: Your application will use its Client ID, Client Secret, and the received Authorization Code to make a token exchange request to the Authorization Server
//Phase 6: The Authorization Server will send your application an Access Token, Refresh, and optionally an ID token if openid was requested
app.get('/oauth/callback', passport.authenticate('oauth2', {
  session: true,
  successReturnToOrRedirect: '/'
}));

//Phase 1: The end user will attempt to access your application.  Redirect to oauth/login if user not authenticated.
app.use(process.env.CONTEXT_URI,ensureLoggedIn('oauth/login'), 
  function(req, res, next) {
   
    console.log('req.user = ' + util.inspect(req.user, false, null, true));

    //Not calling an API.  Just display the id token claims
    if (req.url === "/") {

      claims = "<ul>";
      for (let key in req.user) {
        claims = claims + '<li>' + key + ": " + req.user[key] + '</li>'
      }
      claims = claims + '</ul>';

      return res.send('<h1>id_token claims</h1>' + claims);
    }

    next();
  }
  
);

//Callback defined after successful completion of Phase 6. Validates returned id_token and stores tokens to session.
const tokenToProfile = async (req, accessToken, refreshToken, params, profile, done) => {
  
  //Store access and refresh tokens in session
  req.session.accessToken = accessToken;
  req.session.refreshToken = refreshToken;
  
  const expires_in = params['expires_in'];
  req.session.expiresIn = expires_in;
  req.session.expireMilliSec = Date.now() + (expires_in - process.env.AUTH_CLOCK_SKEW) * 1000;
    
  //Validate and decode idToken
  const idToken = params['id_token'];
  
  var client = jwksClient({
    jwksUri: `${process.env.AUTH_ID_TOKEN_JWKS}`
  });

  function getKey(header, callback){
    client.getSigningKey(header.kid,
      function(err, key) {
        if (err) return callback(err, null);
        var signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
      }
    );
  }

  options = {};
  jwt.verify(idToken, getKey, options,
    function(err, decoded) {
      if (err) done(err, null);
      else done(null, decoded);
    }
  );

};

//Oauth strategy.  Includes callback 'tokenToProfile' after successful completion of phase 6. 
const strategy = new OAuth2Strategy({
  state: true,
  authorizationURL: process.env.AUTH_AUTHORIZATION_URL,
  tokenURL: process.env.AUTH_TOKEN_URL,
  clientID: process.env.AUTH_CLIENT_ID,
  clientSecret: process.env.AUTH_CLIENT_SECRET,
  callbackURL: process.env.AUTH_CALLBACK_URL,
  scope: process.env.AUTH_CLIENT_SCOPE,
  passReqToCallback: true 
}, tokenToProfile);


//Serialize user to session
passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user);
  console.log(util.inspect(user, false, null, true))  

  done(null, user);
});

//Deserialize user from session
passport.deserializeUser(function(user, done) {
  console.log('deserializeUser: ' + user);
  console.log(util.inspect(user, {showHidden: false, depth: null}))    
  done(null, user);
});

passport.use(strategy);
refresh.use(strategy);

//Function to refresh accessToken if expired
const refreshTokens = function(req, resp, next) {

  const expireMilliSec = req.session.expireMilliSec;
  
  if (expireMilliSec <= Date.now()) {
    refresh.requestNewAccessToken('oauth2', req.session.refreshToken,
      function(err, accessToken, refreshToken) {
       
        if (err) return next(err);

        req.session.refreshToken = refreshToken;
        req.session.accessToken = accessToken;
        req.session.expireMilliSec = Date.now() + (req.session.expiresIn - process.env.AUTH_CLOCK_SKEW) * 1000;

        return next();
     
      }
    );
  } else return next();
}

//Phase 7: Your application will use the received Access Token to access protected backend services.
//Use refreshTokens function to refresh expired access token before calling API
app.get('/api', refreshTokens,
  function(req, res, next) {
    const options = {
      url: process.env.API_URL,
      headers: {
        authorization: `Bearer ${req.session.accessToken}`
      }
    };
     
    function callback(err, response, body) {
      
      if (err) return next(err);
      if (response.statusCode != 200) {
        console.log('response.statusMessage', util.inspect(response.statusMessage, {showHidden: false, depth: null}));
        console.log('response.body', util.inspect(response.body, {showHidden: false, depth: null}));
        const re = {status: response.statusCode,
                    message: 'API service call failed: ' + (response.statusMessage && response.statusMessage !== "" ? response.statusMessage :  JSON.parse(response.body).error)};
        return next(re);
      }
     
      res.send("<h1>API service call succeeded</h1>");
    }
    
    request(options, callback);
  }
)

app.get('/logout', function (req, res) {
  req.session.destroy(() => res.redirect('/'));
});

//Express catch all error handler
app.use(function (err, req, res, next) {

  console.log(util.inspect(err, {showHidden: false, depth: null}));
  let status = err.status || 500;
  res.status(status).send('<h1>' + status + ": " + err.message + '</h1>');
});

var server = app.listen(process.env.PORT, function () {
  console.log('Listening on port %d', server.address().port)
});

