::  State compatibility is confined to this gate. Every migration preserves
::  publication content, grants, follows, receipts, replay keys and requests.
/-  d=domheap, x=x402
|%
+$  plan-0  [facilitator=@t origin=@t days=@ud =requirements:x]
+$  quote-0
  $:  who=@p
      expires=@da
      duration=@dr
      plan=plan-0
      resource=@t
      nonce=@t
      phase=?(%offered %verifying %settling %paid %failed)
      payment=(unit payment:x)
      result=(unit settlement:x)
      request=(unit @ta)
  ==
+$  state-0
  $:  %0
      publication=publication:d
      members=members:d
      following=(set @p)
      plan=(unit plan-0)
      quotes=(map @uv quote-0)
      redeemed=(set [network=@t transaction=@t])
      pending=(map @uv remote-request:d)
  ==
++  plan
  |=  old=plan-0
  ^-  plan:d
  =/  amount=@ud  (need (rush amount.requirements.old dem))
  =/  price
    |=  days=@ud
    ^-  @t
    (crip (a-co:co (max 1 (div (mul amount days) (max 1 days.old)))))
  [& facilitator.old origin.old 6 [(price 1) (price 7) (price 30) (price 365)] requirements.old]
++  quote
  |=  old=quote-0
  ^-  quote:d
  =/  =period:d
    ?:  =(~d1 duration.old)  %day
    ?:  =(~d7 duration.old)  %week
    ?:  =(~d365 duration.old)  %year
    %month
  :*  who.old
      expires.old
      duration.old
      period
      (plan plan.old)
      resource.old
      nonce.old
      phase.old
      payment.old
      result.old
      request.old
  ==
++  load
  |=  saved=vase
  ^-  state:d
  ?+  -.q.saved  ~|('Unsupported Domheap state version.' !!)
      %1
    !<(state:d saved)
      %0
    =/  old  !<(state-0 saved)
    :*  %1
        publication.old
        members.old
        following.old
        (bind plan.old plan)
        (~(run by quotes.old) quote)
        redeemed.old
        pending.old
    ==
  ==
--
