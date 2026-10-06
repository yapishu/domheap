::  Optional exact/EIP-3009 helpers. Signature verification and chain
::  settlement belong to the facilitator; these checks bind its input to
::  the resource server's quote before anything is sent off ship.
/-  x=x402
/+  j=x402-json
|%
++  lower
  |=  text=@t
  ^-  @t
  (crip (cass (trip text)))
++  hex
  |=  [bytes=@ud value=@]
  ^-  @t
  =/  count=@ud  (mul bytes 2)
  =/  out=tape  ~
  |-
  ?:  =(0 count)  (cat 3 '0x' (crip out))
  =/  digit=@tD  (cut 3 [(end 2 value) 1] '0123456789abcdef')
  $(count (dec count), value (rsh 2 value), out [digit out])
++  valid-hex
  |=  [bytes=@ud text=@t]
  ^-  ?
  ?&  =((add 2 (mul 2 bytes)) (met 3 text))
      =('0x' (cut 3 [0 2] text))
      %+  levy  (slag 2 (trip text))
      |=(c=@tD |(&((gte c '0') (lte c '9')) &((gte c 'a') (lte c 'f')) &((gte c 'A') (lte c 'F'))))
  ==
++  payer
  |=  p=payment:x
  ^-  @t
  (text:j (field:j (field:j payload.p 'authorization') 'from'))
++  bound
  |=  [p=payment:x nonce=@t now=@ud expiry=@ud]
  ^-  ?
  =/  auth  (field:j payload.p 'authorization')
  =/  before  (need (rush (text:j (field:j auth 'validBefore')) dem))
  =/  after  (need (rush (text:j (field:j auth 'validAfter')) dem))
  ?&  =(nonce (text:j (field:j auth 'nonce')))
      =((lower pay-to.accepted.p) (lower (text:j (field:j auth 'to'))))
      =(amount.accepted.p (text:j (field:j auth 'value')))
      (valid-hex 20 (payer p))
      (valid-hex 65 (text:j (field:j payload.p 'signature')))
      (lte after now)
      (gth before now)
      (lte before expiry)
  ==
--
