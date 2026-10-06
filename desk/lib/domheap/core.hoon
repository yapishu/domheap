::  Event coordinator. Every helper returns cards plus explicitly new state.
/-  d=domheap
/+  access=domheap-access, web=domheap-http, nb=domheap-notes
/+  view=domheap-view, admin=domheap-admin, peer=domheap-peer, e=domheap-events
/+  pricing=domheap-pricing
/+  server, pay=domheap-payments, xj=x402-json
|_  [=bowl:gall state=state:d]
++  init
  ^-  (quip card:agent:gall state:d)
  =?  state  =('' title.publication.state)
    state(title.publication (crip "{(scow %p our.bowl)}'s publication"))
  :_  state
  %+  weld
    ^-  (list card:agent:gall)
    ~[[%pass /bind %arvo %e %connect [~ /apps/domheap/api] %domheap]]
  %+  weld
    ?:  (~(has by wex.bowl) [/notebook our.bowl %notes])  ~
    watch:(nb bowl publication.state)
  %+  turn  ~(tap in following.state)
  |=  who=@p
  ^-  card:agent:gall
  [%pass /follow/(scot %p who) %agent [who %domheap] %watch /v1/changes]
++  poke
  |=  [=mark =vase]
  ^-  (quip card:agent:gall state:d)
  ?>  =(%handle-http-request mark)
  ::  Eyre uses /eyre for owner requests and / for delegated identities.
  ?>  |(=(/eyre sap.bowl) =(~ sap.bowl))
  =+  !<([rid=@ta req=inbound-request:eyre] vase)
  ::  Recover malformed client input as a 400 without changing state.
  ::  We do not turn failures into default/empty state or leak stack traces.
  =/  attempt  (mule |.((serve rid req)))
  ?-  -.attempt
    %&  p.attempt
    %|  [(error:web rid 400 'The request is invalid. Check the fields and try again.') state]
  ==
++  serve
  |=  [rid=@ta req=inbound-request:eyre]
  ^-  (quip card:agent:gall state:d)
  =/  line  (parse-request-line:server url.request.req)
  ::  @uv quote IDs contain dots. The HTTP parser calls their last group
  ::  an extension; API paths treat the complete segment as the ID.
  =/  site=path
    ?~  ext.line  `path`site.line
    ?~  site.line  ~
    %+  snoc
      (scag (dec (lent site.line)) `path`site.line)
    (cat 3 (rear site.line) (cat 3 '.' u.ext.line))
  =/  route=path  (slag 3 site)
  ?.  =(/apps/domheap/api (scag 3 `path`site.line))
    [(error:web rid 404 'Unknown route.') state]
  ?:  =(%'GET' method.request.req)
    ?:  ?=([%payment @ ~] route)
      [(status:(pay bowl state) rid (slav %uv i.t.route)) state]
    ?:  =(/author route)
      ?.  =(src.bowl our.bowl)  [(error:web rid 403 'Only the author can open this page.') state]
      [(response:web rid 200 author:(view bowl state) ~) state]
    ?:  ?=([%remote host=@ *] route)
      ?.  =(src.bowl our.bowl)
        [(error:web rid 403 'Log in to your own ship to use the reading room.') state]
      =/  host  (slav %p i.t.route)
      (fetch:(peer bowl state) host t.t.route rid)
    =/  result  (read:(view bowl state) route src.bowl)
    [(response:web rid status.result body.result ~) state]
  ?.  =(%'POST' method.request.req)
    [(error:web rid 405 'Use GET or POST for this resource.') state]
  ::  A custom header makes mutations require a same-origin CORS preflight.
  ::  This API never grants cross-origin access.
  ?.  =(`'1' (get-header:http 'x-domheap' header-list.request.req))
    [(error:web rid 403 'Reload Domheap before making changes.') state]
  ?:  =(/quote route)
    =/  data  (body:web request.req)
    %^  issue:(pay bowl state)
      rid
      (slav %p (text:xj (field:xj data 'ship')))
    (period:pricing (text:xj (field:xj data 'period')))
  ?:  ?=([%subscribe @ ~] route)
    %:  submit:(pay bowl state)
      rid
      (slav %uv i.t.route)
      (get-header:http 'payment-signature' header-list.request.req)
    ==
  ?.  =(/action route)  [(error:web rid 404 'Unknown action.') state]
  ?.  &(authenticated.req =(src.bowl our.bowl))
    [(error:web rid 403 'Only the author can make this change.') state]
  =^  cards  state  (run:(admin bowl state) (body:web request.req))
  [(weld cards (response:web rid 200 [%b &] ~)) state]
++  watch
  |=  =path
  ^-  (quip card:agent:gall state:d)
  ?+  path  ~|('Unknown subscription path.' !!)
      [%http-response @ ~]
    ?>  |(=(/eyre sap.bowl) =(~ sap.bowl))
    ::  Do not let a different identity attach to an in-flight HTTP result.
    ?>  !(lien ~(val by sup.bowl) |=([who=@p p=(list @ta)] &(=(p path) !=(who src.bowl))))
    [~ state]
      [%updates ~]
    ?>  =(src.bowl our.bowl)
    [~[[%give %fact ~ [%json !>(`json`[%b &])]]] state]
      [%v1 %changes ~]
    [~[[%give %fact ~ [%json !>(`json`[%b &])]]] state]
      [%v1 %read who=@ nonce=@ *]
    [(serve:(peer bowl state) (slav %p i.t.t.path) t.t.t.t.path) state]
  ==
++  agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card:agent:gall state:d)
  ?+  wire  [~ state]
      [%notebook ~]
    ?:  ?=(%fact -.sign)  [(both:e our.bowl) state]
    ?:  |(?=(%kick -.sign) ?=([%watch-ack ^] sign))
      [~[[%pass /retry-notebook %arvo %b %wait (add now.bowl ~s30)]] state]
    [~ state]
      [%follow who=@ ~]
    =/  who  (slav %p i.t.wire)
    ?.  (~(has in following.state) who)  [~ state]
    ?:  ?=(%fact -.sign)  [[(changed:e who)]~ state]
    ?:  |(?=(%kick -.sign) ?=([%watch-ack ^] sign))
      [~[[%pass /retry-follow/(scot %p who) %arvo %b %wait (add now.bowl ~s30)]] state]
    [~ state]
      [%read id=@ ~]
    (receive:(peer bowl state) (slav %uv i.t.wire) sign)
  ==
++  arvo
  |=  [=wire =sign-arvo]
  ^-  (quip card:agent:gall state:d)
  ?+  wire  [~ state]
      [%payment id=@ stage=@ ~]
    ?>  ?=([%iris %http-response *] sign-arvo)
    =/  stage=?(%verify %settle)
      ?+  i.t.t.wire  !!
        %verify  %verify
        %settle  %settle
      ==
    (response:(pay bowl state) (slav %uv i.t.wire) stage client-response.sign-arvo)
      [%payment-timeout id=@ ~]
    (timeout:(pay bowl state) (slav %uv i.t.wire))
      [%bind ~]
    ?>  ?=([%eyre %bound *] sign-arvo)
    ~?  !accepted.sign-arvo  'Domheap API binding was rejected.'
    [~ state]
      [%retry-notebook ~]
    [watch:(nb bowl publication.state) state]
      [%retry-follow who=@ ~]
    =/  who  (slav %p i.t.wire)
    ?.  (~(has in following.state) who)  [~ state]
    [~[[%pass /follow/(scot %p who) %agent [who %domheap] %watch /v1/changes]] state]
      [%read-timeout id=@ ~]
    %+  fail:(peer bowl state)
      (slav %uv i.t.wire)
    'The publication did not respond within 30 seconds.'
      [%maintenance ~]
    ::  Browser readers recheck on this tick, including when a grant expires.
    :_  sweep:(pay bowl state)
    :~  [%pass /maintenance %arvo %b %wait (add now.bowl ~m1)]
        (changed:e our.bowl)
    ==
  ==
--
