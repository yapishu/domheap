::  x402 HTTP transport. The library creates standard v2 headers and
::  facilitator request bodies; it has no knowledge of Domheap or ships.
/-  x=x402
/+  j=x402-json
|%
++  encode-header
  |=  jon=json
  ^-  @t
  (en:base64:mimes:html (as-octs:mimes:html (en:json:html jon)))
++  decode-header
  |=  header=@t
  ^-  (unit payment:x)
  ::  Bound allocation before base64 or JSON parsing. Oversize payment
  ::  proofs are rejected, not truncated into a different signed message.
  ?:  (gth (met 3 header) 32.768)  ~
  =/  parsed
    %-  mule
    |.
    =/  raw  (need (de:base64:mimes:html header))
    (de-payment:j (need (de:json:html q.raw)))
  ?-  -.parsed
    %&  `p.parsed
    %|  ~
  ==
++  required-header
  |=  r=required:x
  ^-  [@t @t]
  ['payment-required' (encode-header (en-required:j r))]
++  response-header
  |=  r=settlement:x
  ^-  [@t @t]
  ['payment-response' (encode-header (en-settlement:j r))]
++  matches
  |=  [expected=requirements:x actual=payment:x]
  ^-  ?
  ::  Structural equality includes amount, recipient, chain, timeout and
  ::  token metadata. Never let the payer choose a cheaper requirement.
  =(expected accepted.actual)
++  facilitator-body
  |=  [p=payment:x r=requirements:x]
  ^-  json
  %-  pairs:enjs:format
  :~  ['x402Version' n+'2']
      ['paymentPayload' (en-payment:j p)]
      ['paymentRequirements' (en-requirements:j r)]
  ==
++  settled
  |=  [expected=requirements:x result=settlement:x]
  ^-  ?
  ?&  success.result
      !=('' transaction.result)
      =(network.expected network.result)
  ==
--
