::  Operator recovery closes only expired, unsettled authorizations.
/-  d=domheap, x=x402
/+  pay=domheap-payments
:-  %say
|=  *
:-  %noun
=|  state=state:d
=|  bowl=bowl:gall
=.  bowl  bowl(our ~lux, src ~lux, now ~2026.10.2)
=/  req=requirements:x
  ['exact' 'eip155:84532' '5000000' 'asset' 'recipient' 300 [%o ~]]
=/  plan=plan:d
  [& 'https://facilitator.test' 'https://publication.test' 6 ['160000' '1150000' '5000000' '60000000'] req]
=/  q=quote:d
  [~nec ~2026.10.1 ~d30 %month plan 'https://publication.test/subscribe/id' 'nonce' %settling ~ ~ ~]
=.  state  state(quotes (~(put by quotes.state) 0v1 q))
=/  result  (dismiss:(pay bowl state) 0v1)
=/  next=state:d  +.result
=/  kept  (need (~(get by quotes.next) 0v1))
?>  =(%failed phase.kept)
?>  =(members.state members.next)
=/  early  (mule |.((dismiss:(pay bowl(now ~2026.9.30) state) 0v1)))
?>  ?=(%| -.early)
=/  remote  (mule |.((dismiss:(pay bowl(src ~nec) state) 0v1)))
?>  ?=(%| -.remote)
'payment recovery rejects early or unauthorized closure'
