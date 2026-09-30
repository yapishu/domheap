::  x402 v2 transport types. These contain no publication or ACL policy.
::  Amounts are decimal strings in atomic token units, never floats.
|%
+$  requirements
  $:  scheme=@t
      network=@t
      amount=@t
      asset=@t
      pay-to=@t
      timeout=@ud
      extra=json
  ==
+$  resource
  [url=@t description=@t mime-type=@t]
+$  required
  [=resource accepts=(list requirements) extensions=json]
+$  payment
  [=resource accepted=requirements payload=json extensions=json]
+$  verification
  [valid=? payer=(unit @t) reason=(unit @t)]
+$  settlement
  [success=? transaction=@t network=@t payer=(unit @t) reason=(unit @t)]
--
