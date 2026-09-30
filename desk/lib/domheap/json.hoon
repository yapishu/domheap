::  Public projections only receive a body after +readable applies the ACL.
::  Index entries contain the public excerpt even for the author; opening a
::  post performs a fresh entitlement check on the full-body endpoint.
/-  n=notes, d=domheap
/+  c=domheap-content, a=domheap-access, xj=x402-json
|%
++  date
  |=  time=@da
  ^-  json
  (numb:enjs:format (unm:chrono:userlib time))
++  post
  |=  [p=note:n can-read=? summary=?]
  ^-  json
  =/  divided  (split:c body-md.p)
  =/  view  (readable:c body-md.p ?&(can-read !summary))
  %-  pairs:enjs:format
  :~  ['id' s+(scot %ud id.p)]
      ['title' s+title.p]
      ['body' s+text.view]
      ['paid' b+?=(^ remainder.divided)]
      ['locked' b+locked.view]
      ['createdAt' (date created-at.p)]
      ['updatedAt' (date updated-at.p)]
      ['revision' (numb:enjs:format revision.p)]
  ==
++  publication
  |=  [p=publication:d host=@p avatar=@t cover=@t]
  ^-  json
  %-  pairs:enjs:format
  :~  ['title' s+title.p]
      ['description' s+description.p]
      ['about' s+about.p]
      ['avatar' s+avatar]
      ['cover' s+cover]
      ['host' s+(scot %p host)]
      ['configured' b+?=(^ notebook.p)]
  ==
++  member
  |=  [who=@p m=member:d now=@da]
  ^-  json
  %-  pairs:enjs:format
  :~  ['ship' s+(scot %p who)]
      ['expiresAt' ?~(expires.m ~ (date u.expires.m))]
      ['source' s+source.m]
      ['active' b+?~(expires.m & (gth u.expires.m now))]
  ==
++  notebook
  |=  nb=notebook-summary:n
  ^-  json
  %-  pairs:enjs:format
  :~  ['name' s+name.flag.nb]
      ['host' s+(scot %p ship.flag.nb)]
      ['title' s+title.notebook.nb]
      ['rootFolderId' s+(scot %ud +(id.notebook.nb))]
      ['visibility' s+visibility.nb]
  ==
++  plan
  |=  p=(unit plan:d)
  ^-  json
  ?~  p  ~
  %-  pairs:enjs:format
  :~  ['enabled' b+enabled.u.p]
      ['decimals' (numb:enjs:format decimals.u.p)]
      :-  'prices'
      %-  pairs:enjs:format
      :~  ['day' s+day.prices.u.p]
          ['week' s+week.prices.u.p]
          ['month' s+month.prices.u.p]
          ['year' s+year.prices.u.p]
      ==
      ['origin' s+origin.u.p]
      ['requirements' (en-requirements:xj requirements.u.p)]
  ==
--
