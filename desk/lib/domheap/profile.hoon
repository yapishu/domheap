::  The contact value map is read at request time. Empty image overrides
::  mean "use my profile", so profile changes appear without copying URLs.
|=  =bowl:gall
|%
++  contact
  ^-  (map @tas *)
  ?.  .^(? %gu /(scot %p our.bowl)/contacts/(scot %da now.bowl)/$)
    ~
  .^((map @tas *) %gx /(scot %p our.bowl)/contacts/(scot %da now.bowl)/v1/self/noun)
++  image
  |=  key=@tas
  ^-  @t
  ?~  value=(~(get by contact) key)  ''
  ?.  ?=([%look @] u.value)  ''
  `@t`+.u.value
++  nickname
  ^-  @t
  ?~  value=(~(get by contact) %nickname)  (scot %p our.bowl)
  ?.  ?=([%text @] u.value)  (scot %p our.bowl)
  `@t`+.u.value
--
