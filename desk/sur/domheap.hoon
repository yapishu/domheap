::  Persistent application data deliberately excludes remote post bodies.
/-  x=x402
|%
+$  publication
  $:  title=@t
      description=@t
      about=@t
      avatar=@t
      cover=@t
      notebook=(unit @tas)
  ==
::  A null expiry grants continuing access until the author revokes it.
+$  member  [expires=(unit @da) source=?(%paid %gift)]
+$  members  (map @p member)
+$  period  ?(%day %week %month %year)
+$  prices  [day=@t week=@t month=@t year=@t]
+$  plan
  $:  enabled=?
      facilitator=@t
      origin=@t
      decimals=@ud
      =prices
      =requirements:x
  ==
::  A quote binds an EIP-3009 nonce to one ship and one immutable price.
::  %settling is durable: ambiguous network failures never auto-retry a charge.
+$  quote
  $:  who=@p
      expires=@da
      duration=@dr
      =period
      =plan
      resource=@t
      nonce=@t
      phase=?(%offered %verifying %settling %paid %failed)
      payment=(unit payment:x)
      result=(unit settlement:x)
      request=(unit @ta)
  ==
+$  remote-request
  [host=@p rid=@ta expires=@da]
+$  state
  $:  %1
      =publication
      =members
      following=(set @p)
      plan=(unit plan)
      quotes=(map @uv quote)
      redeemed=(set [network=@t transaction=@t])
      pending=(map @uv remote-request)
  ==
--
