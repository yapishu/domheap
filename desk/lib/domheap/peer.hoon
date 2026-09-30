::  Ames reads are one-shot watches. Only the request ID and deadline enter
::  local state; the remote body goes straight from the fact to Eyre.
::  Urbit's event log still records delivered events, as for all Ames data.
/-  d=domheap
/+  web=domheap-http, view=domheap-view, x402-json
|=  [=bowl:gall state=state:d]
|%
++  fetch
  |=  [host=@p route=path rid=@ta]
  ^-  (quip card:agent:gall state:d)
  ?>  =(src.bowl our.bowl)
  ?>  (lth (lent ~(tap by pending.state)) 64)
  =/  id=@uv  (shas %domheap-read eny.bowl)
  =/  deadline=@da  (add now.bowl ~s30)
  :_  state(pending (~(put by pending.state) id [host rid deadline]))
  :~  [%pass /read/(scot %uv id) %agent [host %domheap] %watch (weld /v1/read/(scot %p our.bowl)/(scot %uv id) route)]
      [%pass /read-timeout/(scot %uv id) %arvo %b %wait deadline]
  ==
++  serve
  |=  [requester=@p route=path]
  ^-  (list card:agent:gall)
  ?>  =(requester src.bowl)
  ::  Explicitly allow only public/read routes. An author URL can never be
  ::  smuggled through the peer proxy, even by the publication's own ship.
  ?>  ?|  =(/publication route)
          =(/posts route)
          =(/session route)
          ?=([%posts @ ~] route)
      ==
  =/  result  (read:(view bowl state) route src.bowl)
  =/  answer=json
    %-  pairs:enjs:format
    :~  ['status' (numb:enjs:format status.result)]
        ['body' body.result]
    ==
  :~  [%give %fact ~ [%json !>(answer)]]
      [%give %kick ~ ~]
  ==
++  receive
  |=  [id=@uv =sign:agent:gall]
  ^-  (quip card:agent:gall state:d)
  ?~  req=(~(get by pending.state) id)  [~ state]
  =*  r  u.req
  ?>  =(src.bowl host.r)
  ?:  ?=(%watch-ack -.sign)
    ?~  p.sign  [~ state]
    (fail id 'The publication could not be reached. Try again shortly.')
  ?:  ?=(%kick -.sign)
    (fail id 'The publication closed the request. Try again.')
  ?.  ?=(%fact -.sign)  [~ state]
  ?.  =(%json p.cage.sign)  (fail id 'The publication sent an invalid response.')
  =/  parsed
    %-  mule
    |.
    =/  answer  !<(json q.cage.sign)
    [(number:x402-json (field:x402-json answer 'status')) (field:x402-json answer 'body')]
  ?-  -.parsed
    %|  (fail id 'The publication sent an invalid response.')
    %&
      =/  [status=@ud body=json]  p.parsed
      ?>  &((gte status 200) (lte status 599))
      :_  state(pending (~(del by pending.state) id))
      %+  weld  (finish id r)
      (response:web rid.r status body ~)
  ==
++  fail
  |=  [id=@uv message=@t]
  ^-  (quip card:agent:gall state:d)
  ?~  req=(~(get by pending.state) id)  [~ state]
  :_  state(pending (~(del by pending.state) id))
  %+  weld  (finish id u.req)
  (error:web rid.u.req 502 message)
++  finish
  |=  [id=@uv r=remote-request:d]
  ^-  (list card:agent:gall)
  :~  [%pass /read/(scot %uv id) %agent [host.r %domheap] %leave ~]
      [%pass /read-timeout/(scot %uv id) %arvo %b %rest expires.r]
  ==
--
