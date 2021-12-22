# node-oauth-sample-app

This node.js web application demonstrates authorization code flow using using passport-oauth strategy.


Phases described in the API Security guide ->https://docs.google.com/document/d/1sFk1RrLa6Z4OAegJFFMMdYXktFEcjUDoMONB_Exh6_4/edit#



Usage
=====

Install node if required  from https://nodejs.org/en/

From root folder run

npm install             (Installs required packages including passport.  This will hang behind corp firewall.  Disconnect from corp VPN)
node App.js             (Runs server on port 8080)

In browser

http://localhost:8080/   ->  This will start the authorization code flow.  Should see id_token claims displayed in browser.

http://localhost:8080/api ->  Calls a protected API using access_token. 





