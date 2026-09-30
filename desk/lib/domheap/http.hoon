::  HTTP responses are never cached: even a public preview can become private
::  when the author moves the paywall. Eyre serves only static assets cached.
/+  server
|%
++  response
  |=  [rid=@ta status=@ud jon=json headers=(list [@t @t])]
  ^-  (list card:agent:gall)
  %+  give-simple-payload:app:server  rid
  :_  `(json-to-octs:server jon)
  :-  status
  %+  weld  headers
  :~  ['content-type' 'application/json; charset=utf-8']
      ['cache-control' 'no-store']
      ['vary' 'Cookie']
      ['x-content-type-options' 'nosniff']
  ==
++  error
  |=  [rid=@ta status=@ud message=@t]
  (response rid status (pairs:enjs:format ~[['error' s+message]]) ~)
++  body
  |=  req=request:http
  ^-  json
  ?>  ?=(^ body.req)
  ?>  (lte p.u.body.req 1.048.576)
  (need (de:json:html q.u.body.req))
--
