::  Pure invariants run on the ship's Hoon compiler, including the libraries
::  the live agent uses. Each named assertion bails if its invariant fails.
/-  x=x402, d=domheap
/+  a=domheap-access, c=domheap-content, p=x402-protocol, j=x402-json
/+  t=x402-transport
:-  %say
|=  *
:-  %noun
|^
  ?>  =(['lead' `'secret'] (split:c 'lead<<<paywall>>>secret'))
  ?>  =(['lead' &] (readable:c 'lead<<<paywall>>>secret' |))
  ?>  =(['leadsecret' |] (readable:c 'lead<<<paywall>>>secret' &))
  ?>  =(['' &] (readable:c '<<<paywall>>>secret' |))
  ?>  =(['plain' ~] (split:c 'plain'))
  ?>  !(allowed:a ~zod ~nec ~2026.1.1 ~)
  ?>  (allowed:a ~zod ~zod ~2026.1.1 ~)
  =/  members=members:d  (~(put by *members:d) ~nec [`~2026.1.2 %gift])
  ?>  (allowed:a ~zod ~nec ~2026.1.1 members)
  ?>  !(allowed:a ~zod ~nec ~2026.1.2 members)
  =.  members  (~(put by members) ~nec [~ %gift])
  ?>  (allowed:a ~zod ~nec ~2026.1.3 members)
  =/  req=requirements:x  requirements
  =/  pay=payment:x  [[url 'Subscription' 'application/json'] req [%o ~] [%o ~]]
  ?>  =(`pay (decode-header:p (encode-header:p (en-payment:j pay))))
  ?>  =(~ (decode-header:p 'not base64'))
  ?>  (matches:p req pay)
  ?>  !(matches:p req pay(amount.accepted '1'))
  ?>  !(settled:p req [| 'tx' network.req ~ ~])
  ?>  !(settled:p req [& '' network.req ~ ~])
  ?>  !(settled:p req [& 'tx' 'other-chain' ~ ~])
  ?>  (settled:p req [& 'tx' network.req ~ ~])
  'content, ACL and x402 invariants pass'
++  url  'https://example.test/subscription'
++  requirements
  ^-  requirements:x
  ['exact' 'eip155:84532' '1000000' 'asset' 'recipient' 300 [%o ~]]
--
