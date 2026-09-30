::  The read API shared by HTTP and Ames. `reader` is supplied exclusively
::  by Gall, never decoded from a request body, query string, or header.
/-  d=domheap, n=notes
/+  xj=x402-json, evm=x402-evm
/+  a=domheap-access, j=domheap-json, nb=domheap-notes, profile=domheap-profile
|=  [=bowl:gall state=state:d]
|%
++  notebook  (nb bowl publication.state)
++  contact  (profile bowl)
++  meta
  ^-  json
  =*  p  publication.state
  %:  publication:j
    p
    our.bowl
    ?:(=('' avatar.p) (image:contact %avatar) avatar.p)
    ?:(=('' cover.p) (image:contact %cover) cover.p)
  ==
++  read
  |=  [route=path reader=@p]
  ^-  [status=@ud body=json]
  =/  access=?  (allowed:a our.bowl reader now.bowl members.state)
  ?+  route  [404 (err 'This page does not exist.')]
      [%publication ~]
    [200 meta]
      [%session ~]
    :-  200
    %-  pairs:enjs:format
    :~  ['host' s+(scot %p our.bowl)]
        ['viewer' s+(scot %p reader)]
        ['owner' b+=(our.bowl reader)]
        ['subscribed' b+access]
        :-  'expiresAt'
        ?~  m=(~(get by members.state) reader)  ~
        ?~  expires.u.m  ~
        (date:j u.expires.u.m)
        :-  'permanent'
        :-  %b
        ?:  =(reader our.bowl)  &
        ?~  m=(~(get by members.state) reader)  |
        ?=(~ expires.u.m)
        ['plan' ?~(plan.state ~ ?:(enabled.u.plan.state (plan:j plan.state) ~))]
    ==
      [%posts ~]
    :-  200
    %-  pairs:enjs:format
    :~  ['publication' meta]
        ['posts' a+(turn posts:notebook |=(p=note:n (post:j p | &)))]
    ==
      [%posts id=@ ~]
    ?~  id=(slaw %ud i.t.route)  [400 (err 'Invalid post ID.')]
    ?~  post=(post:notebook u.id)  [404 (err 'This post is no longer available.')]
    [200 (post:j u.post access |)]
  ==
++  author
  ^-  json
  %-  pairs:enjs:format
  :~  ['publication' meta]
      ['notebook' ?~(notebook.publication.state ~ s+u.notebook.publication.state)]
      ['avatarOverride' s+avatar.publication.state]
      ['coverOverride' s+cover.publication.state]
      ['notesAvailable' b+available:notebook]
      ['notebooks' a+(turn notebooks:notebook notebook:j)]
      ['members' a+(turn ~(tap by members.state) |=([who=@p m=member:d] (member:j who m now.bowl)))]
      ['following' a+(turn ~(tap in following.state) |=(who=@p s+(scot %p who)))]
      ['plan' (plan:j plan.state)]
      ['facilitator' ?~(plan.state s+'' s+facilitator.u.plan.state)]
      ['origin' ?~(plan.state s+'' s+origin.u.plan.state)]
      :-  'payments'
      :-  %a
      %+  turn  ~(tap by quotes.state)
      |=  [id=@uv q=quote:d]
      %-  pairs:enjs:format
      :~  ['id' s+(scot %uv id)]
          ['ship' s+(scot %p who.q)]
          ['phase' s+phase.q]
          ['nonce' s+nonce.q]
          ['payer' ?~(payment.q ~ s+(payer:evm u.payment.q))]
          ['expiresAt' (date:j expires.q)]
          ['requirements' (en-requirements:xj requirements.plan.q)]
          ['settlement' ?~(result.q ~ (en-settlement:xj u.result.q))]
      ==
  ==
++  err
  |=  message=@t
  ^-  json
  (pairs:enjs:format ~[['error' s+message]])
--
