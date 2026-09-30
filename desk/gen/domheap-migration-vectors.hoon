::  Focused state migration checks retain paid receipts and unfinished work.
/-  d=domheap, x=x402
/+  m=domheap-migrate
:-  %say
|=  *
:-  %noun
=|  old=state-0:m
=/  req=requirements:x
  ['exact' 'eip155:84532' '5000000' 'asset' 'recipient' 300 [%o ~]]
=/  plan=plan-0:m  ['https://facilitator.test' 'https://publication.test' 30 req]
=/  q=quote-0:m
  [~nec ~2026.10.1 ~d30 plan 'https://publication.test/subscribe/id' 'nonce' %settling ~ ~ ~]
=.  old
  old(title.publication 'A kept publication', members (~(put by members.old) ~nec [~ %gift]), plan `plan, quotes (~(put by quotes.old) 0v1 q), redeemed (~(put in redeemed.old) ['network' 'transaction']), pending (~(put by pending.old) 0v2 [~bud %request ~2026.10.1]))
=/  current  (load:m !>(old))
?>  =(publication.old publication.current)
?>  =(members.old members.current)
?>  =(following.old following.current)
?>  =(redeemed.old redeemed.current)
?>  =(pending.old pending.current)
?>  ?=(^ plan.current)
?>  enabled.u.plan.current
?>  =(req requirements.u.plan.current)
=/  kept  (need (~(get by quotes.current) 0v1))
?>  =(duration.q duration.kept)
?>  =(phase.q phase.kept)
?>  =(nonce.q nonce.kept)
?>  =(requirements.plan.q requirements.plan.kept)
?>  =(current (load:m !>(current)))
=/  invalid  (mule |.((load:m !>(%99))))
?>  ?=(%| -.invalid)
'migration preserves publication, ACLs, receipts and pending work'
