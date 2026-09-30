::  Read through to %notes. Domheap never maintains a second copy of a
::  notebook, so edits, deletions and moved paywalls apply to the next read.
/-  n=notes, d=domheap
|=  [=bowl:gall publication=publication:d]
|%
++  available
  ^-  ?
  .^(? %gu /(scot %p our.bowl)/notes/(scot %da now.bowl)/$)
++  notebooks
  ^-  (list notebook-summary:n)
  ?.  available  ~
  .^((list notebook-summary:n) %gx /(scot %p our.bowl)/notes/(scot %da now.bowl)/v0/notebooks/noun)
++  posts
  ^-  (list note:n)
  ?~  notebook.publication  ~
  ?.  available  ~
  ::  A missing/deleted notebook is an empty publication, not a stale cache.
  =/  have=?
    %+  lien  notebooks
    |=  nb=notebook-summary:n
    &(=(our.bowl ship.flag.nb) =(u.notebook.publication name.flag.nb))
  ?.  have  ~
  =/  all=(list note:n)
    .^((list note:n) %gx /(scot %p our.bowl)/notes/(scot %da now.bowl)/v0/notes/(scot %p our.bowl)/[u.notebook.publication]/noun)
  %+  sort  all
  |=  [a=note:n b=note:n]
  ?:  =(created-at.a created-at.b)  (gth id.a id.b)
  (gth created-at.a created-at.b)
++  post
  |=  id=@ud
  ^-  (unit note:n)
  =/  all  posts
  |-
  ?~  all  ~
  ?:  =(id id.i.all)  `i.all
  $(all t.all)
++  stream
  ^-  (unit path)
  ?~  notebook.publication  ~
  `/v0/notes/(scot %p our.bowl)/[u.notebook.publication]/stream
++  watch
  ^-  (list card:agent:gall)
  ?.  available  ~
  =/  target=(unit path)  stream
  ?~  target  ~
  ~[[%pass /notebook %agent [our.bowl %notes] %watch u.target]]
++  select
  |=  name=@tas
  ^-  ?
  %+  lien  notebooks
  |=  nb=notebook-summary:n
  ?&  =(our.bowl ship.flag.nb)
      =(name name.flag.nb)
      =(%private visibility.nb)
  ==
--
