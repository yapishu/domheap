::  Strict JSON codecs for x402 v2. Decode arms bail on malformed input;
::  callers use +mule at the untrusted transport boundary to return an error.
/-  x=x402
|%
++  field
  |=  [jon=json key=@t]
  ^-  json
  ?>  ?=(%o -.jon)
  (need (~(get by p.jon) key))
++  optional
  |=  [jon=json key=@t]
  ^-  (unit json)
  ?>  ?=(%o -.jon)
  (~(get by p.jon) key)
++  text
  |=  jon=json
  ^-  @t
  ?>  ?=(%s -.jon)
  p.jon
++  number
  |=  jon=json
  ^-  @ud
  ?>  ?=(%n -.jon)
  (need (rush p.jon dem))
++  boolean
  |=  jon=json
  ^-  ?
  ?>  ?=(%b -.jon)
  p.jon
++  maybe-text
  |=  jon=(unit json)
  ^-  (unit @t)
  ?~  jon  ~
  ?:  =(~ u.jon)  ~
  `(text u.jon)
++  en-requirements
  |=  r=requirements:x
  ^-  json
  %-  pairs:enjs:format
  :~  ['scheme' s+scheme.r]
      ['network' s+network.r]
      ['amount' s+amount.r]
      ['asset' s+asset.r]
      ['payTo' s+pay-to.r]
      ['maxTimeoutSeconds' (numb:enjs:format timeout.r)]
      ['extra' extra.r]
  ==
++  de-requirements
  |=  jon=json
  ^-  requirements:x
  :*  (text (field jon 'scheme'))
      (text (field jon 'network'))
      (text (field jon 'amount'))
      (text (field jon 'asset'))
      (text (field jon 'payTo'))
      (number (field jon 'maxTimeoutSeconds'))
      (fall (optional jon 'extra') [%o ~])
  ==
++  en-resource
  |=  r=resource:x
  ^-  json
  %-  pairs:enjs:format
  :~  ['url' s+url.r]
      ['description' s+description.r]
      ['mimeType' s+mime-type.r]
  ==
++  de-resource
  |=  jon=json
  ^-  resource:x
  :*  (text (field jon 'url'))
      (fall (maybe-text (optional jon 'description')) '')
      (fall (maybe-text (optional jon 'mimeType')) '')
  ==
++  en-required
  |=  r=required:x
  ^-  json
  %-  pairs:enjs:format
  :~  ['x402Version' n+'2']
      ['resource' (en-resource resource.r)]
      ['accepts' a+(turn accepts.r en-requirements)]
      ['extensions' extensions.r]
  ==
++  en-payment
  |=  p=payment:x
  ^-  json
  =/  fields=(list [@t json])
    :~  ['x402Version' n+'2']
        ['accepted' (en-requirements accepted.p)]
        ['payload' payload.p]
        ['extensions' extensions.p]
    ==
  %-  pairs:enjs:format
  ?:  =('' url.resource.p)  fields
  [['resource' (en-resource resource.p)] fields]
++  de-payment
  |=  jon=json
  ^-  payment:x
  ?>  =(2 (number (field jon 'x402Version')))
  ::  The core protocol permits omission of resource. Its empty URL is the
  ::  typed representation of absence, and +en-payment omits it on the wire.
  =/  res=resource:x
    ?~  found=(optional jon 'resource')  *resource:x
    (de-resource u.found)
  =/  payload  (field jon 'payload')
  =/  extensions  (fall (optional jon 'extensions') [%o ~])
  ?>  &(?=(%o -.payload) ?=(%o -.extensions))
  :*  res
      (de-requirements (field jon 'accepted'))
      payload
      extensions
  ==
++  de-verification
  |=  jon=json
  ^-  verification:x
  :*  (boolean (field jon 'isValid'))
      (maybe-text (optional jon 'payer'))
      (maybe-text (optional jon 'invalidReason'))
  ==
++  de-settlement
  |=  jon=json
  ^-  settlement:x
  :*  (boolean (field jon 'success'))
      (text (field jon 'transaction'))
      (text (field jon 'network'))
      (maybe-text (optional jon 'payer'))
      (maybe-text (optional jon 'errorReason'))
  ==
++  en-settlement
  |=  r=settlement:x
  ^-  json
  %-  pairs:enjs:format
  :~  ['success' b+success.r]
      ['transaction' s+transaction.r]
      ['network' s+network.r]
      ['payer' ?~(payer.r ~ s+u.payer.r)]
      ['errorReason' ?~(reason.r ~ s+u.reason.r)]
  ==
--
