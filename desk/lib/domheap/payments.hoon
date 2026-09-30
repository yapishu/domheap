::  Subscription policy built on reusable x402 libraries.
::
::  A quote snapshots the recipient, price, duration and facilitator. Its
::  random EIP-3009 nonce binds the signed transfer to the authenticated
::  ship, preventing the same authorization from being claimed by another.
::  Only a successful settlement grants access. An ambiguous settlement is
::  kept pending for reconciliation; retrying the browser cannot pay twice.
/-  d=domheap, x=x402
/+  j=x402-json, p=x402-protocol, t=x402-transport, evm=x402-evm
/+  pricing=domheap-pricing
/+  web=domheap-http, a=domheap-access, e=domheap-events
|=  [=bowl:gall state=state:d]
|%
++  seconds
  |=  time=@da
  ^-  @ud
  (unt:chrono:userlib time)
++  issue
  |=  [rid=@ta who=@p period=period:d]
  ^-  (quip card:agent:gall state:d)
  ?.  =(who src.bowl)
    [(error:web rid 403 'Log in with this ship before subscribing.') state]
  ?~  plan.state
    [(error:web rid 409 'Paid subscriptions are not configured. Contact the author for access.') state]
  ?:  (lien ~(val by quotes.state) |=(q=quote:d &(=(who who.q) ?=(?(%verifying %settling) phase.q))))
    [(error:web rid 409 'A payment for this ship is awaiting confirmation. Check its status before paying again.') state]
  ?.  enabled.u.plan.state
    [(error:web rid 409 'Paid subscriptions are not enabled. Contact the author for access.') state]
  =/  active
    %+  skim  ~(val by quotes.state)
    |=(q=quote:d &((gth expires.q now.bowl) ?=(?(%offered %verifying %settling) phase.q)))
  ?>  (lth (lent active) 512)
  ?>  (lth (lent (skim active |=(q=quote:d =(who who.q)))) 5)
  =/  id=@uv  (shas %domheap-quote eny.bowl)
  =/  nonce=@t  (hex:evm 32 (shas %domheap-authorization eny.bowl))
  =/  url=@t
    (crip "{(trip origin.u.plan.state)}/apps/domheap/api/subscribe/{(scow %uv id)}")
  =/  expiry=@da  (add now.bowl (mul timeout.requirements.u.plan.state ~s1))
  =/  selected=plan:d  u.plan.state
  =.  selected  selected(amount.requirements (amount:pricing prices.selected period))
  =/  q=quote:d
    [who expiry (mul (days:pricing period) ~d1) period selected url nonce %offered ~ ~ ~]
  :_  state(quotes (~(put by quotes.state) id q))
  %:  response:web  rid  201
    %-  pairs:enjs:format
    :~  ['id' s+(scot %uv id)]
        ['ship' s+(scot %p who)]
        ['expiresAt' (numb:enjs:format (unm:chrono:userlib expiry))]
        ['paymentRequired' (en-required:j (required q))]
    ==
  ~
  ==
++  required
  |=  q=quote:d
  ^-  required:x
  :*  [resource.q 'Publication subscription' 'application/json']
      ~[requirements.plan.q]
      ::  Resource-specific binding. The transfer itself remains standard
      ::  exact/EIP-3009 and every facilitator sees an ordinary x402 payload.
      %-  pairs:enjs:format
      :~  :-  'domheap-subscription'
          %-  pairs:enjs:format
          :~  :-  'info'
              %-  pairs:enjs:format
              :~  ['ship' s+(scot %p who.q)]
                  ['nonce' s+nonce.q]
                  ['validBefore' s+(crip (a-co:co (seconds expires.q)))]
                  ['days' (numb:enjs:format (div duration.q ~d1))]
                  ['period' s+period.q]
              ==
          ==
      ==
  ==
++  status
  |=  [rid=@ta id=@uv]
  ^-  (list card:agent:gall)
  ?~  q=(~(get by quotes.state) id)  (error:web rid 404 'Unknown payment.')
  ?.  |(=(src.bowl who.u.q) =(src.bowl our.bowl))
    (error:web rid 403 'This payment belongs to another ship.')
  (response:web rid 200 (receipt u.q) ~)
++  receipt
  |=  q=quote:d
  ^-  json
  %-  pairs:enjs:format
  :~  ['phase' s+phase.q]
      ['ship' s+(scot %p who.q)]
      ['subscribed' b+(allowed:a our.bowl who.q now.bowl members.state)]
      ['settlement' ?~(result.q ~ (en-settlement:j u.result.q))]
  ==
++  submit
  |=  [rid=@ta id=@uv header=(unit @t)]
  ^-  (quip card:agent:gall state:d)
  ?~  found=(~(get by quotes.state) id)
    [(error:web rid 404 'This payment quote does not exist.') state]
  =/  q=quote:d  u.found
  ?.  =(src.bowl who.q)
    [(error:web rid 403 'This payment quote belongs to another ship.') state]
  ?:  =(%paid phase.q)
    [(response:web rid 200 (receipt q) ~[(response-header:p (need result.q))]) state]
  ?:  ?=(?(%verifying %settling) phase.q)
    [(response:web rid 202 (receipt q) ~) state]
  ?:  |(=(%failed phase.q) (lte expires.q now.bowl))
    [(error:web rid 410 'This quote has expired or failed. Request a new quote.') state]
  ?~  header
    [(response:web rid 402 (en-required:j (required q)) ~[(required-header:p (required q))]) state]
  ?~  pay=(decode-header:p u.header)
    [(error:web rid 400 'Invalid PAYMENT-SIGNATURE header.') state]
  ?.  ?&  (matches:p requirements.plan.q u.pay)
          =(resource.q url.resource.u.pay)
          (bound:evm u.pay nonce.q (seconds now.bowl) (seconds expires.q))
      ==
    [(error:web rid 400 'The signed payment does not match this quote.') state]
  =/  next=quote:d  q
  =.  next  next(phase %verifying, payment pay, request `rid)
  :_  state(quotes (~(put by quotes.state) id next))
  :~  (card:t /payment/(scot %uv id)/verify facilitator.plan.q %verify u.pay requirements.plan.q)
      [%pass /payment-timeout/(scot %uv id) %arvo %b %wait (add now.bowl ~m2)]
  ==
++  response
  |=  [id=@uv stage=?(%verify %settle) reply=client-response:iris]
  ^-  (quip card:agent:gall state:d)
  ?~  found=(~(get by quotes.state) id)  [~ state]
  =/  q=quote:d  u.found
  ?.  ?|  &(=(%verify stage) =(%verifying phase.q))
          &(=(%settle stage) =(%settling phase.q))
      ==
    [~ state]
  ?:  ?=(%progress -.reply)  [~ state]
  ?:  ?=(%cancel -.reply)  (failed id stage 'The payment service could not be reached.')
  ?>  ?=(%finished -.reply)
  ?.  &((gte status-code.response-header.reply 200) (lth status-code.response-header.reply 300))
    (failed id stage 'The payment service returned an error.')
  ?~  full-file.reply  (failed id stage 'The payment service returned an empty response.')
  ?:  (gth p.data.u.full-file.reply 65.536)
    (failed id stage 'The payment response is too large.')
  ?~  json=(de:json:html q.data.u.full-file.reply)
    (failed id stage 'The payment service returned invalid JSON.')
  =/  attempt
    %-  mule
    |.
    ?:  =(%verify stage)  (verified id q (de-verification:j u.json))
    (settled id q (de-settlement:j u.json))
  ?-  -.attempt
    %&  p.attempt
    %|  (failed id stage 'The payment service returned an invalid receipt.')
  ==
++  verified
  |=  [id=@uv q=quote:d result=verification:x]
  ^-  (quip card:agent:gall state:d)
  ?.  valid.result  (failed id %verify 'The wallet payment could not be verified.')
  ?>  ?=(^ payment.q)
  ?>  ?=(^ payer.result)
  ?>  =((lower:evm u.payer.result) (lower:evm (payer:evm u.payment.q)))
  =.  q  q(phase %settling)
  :_  state(quotes (~(put by quotes.state) id q))
  ~[(card:t /payment/(scot %uv id)/settle facilitator.plan.q %settle u.payment.q requirements.plan.q)]
++  settled
  |=  [id=@uv q=quote:d result=settlement:x]
  ^-  (quip card:agent:gall state:d)
  ?.  (settled:p requirements.plan.q result)
    =.  state  state(quotes (~(put by quotes.state) id q(result `result)))
    (failed id %settle 'Settlement is not confirmed. Ask the author to check the payment before trying again.')
  ?>  ?=(^ payer.result)
  ?>  ?=(^ payment.q)
  ?>  =((lower:evm u.payer.result) (lower:evm (payer:evm u.payment.q)))
  ?>  (valid-hex:evm 32 transaction.result)
  =/  transaction  [network.result (lower:evm transaction.result)]
  ?>  !(~(has in redeemed.state) transaction)
  =/  prior=(unit @da)
    ?~  m=(~(get by members.state) who.q)  ~
    expires.u.m
  =/  until=@da  (extend:a now.bowl duration.q prior)
  =/  member=member:d
    ?~  m=(~(get by members.state) who.q)  [`until %paid]
    ?~  expires.u.m  u.m
    [`until %paid]
  =.  state
    state(members (~(put by members.state) who.q member), redeemed (~(put in redeemed.state) transaction))
  =/  rid  request.q
  =/  done=quote:d  q
  =.  done  done(phase %paid, result `result, payment ~, request ~)
  :_  state(quotes (~(put by quotes.state) id done))
  %+  weld  (both:e our.bowl)
  ?~  rid  ~
  (response:web u.rid 200 (receipt done) ~[(response-header:p result)])
++  failed
  |=  [id=@uv stage=?(%verify %settle) message=@t]
  ^-  (quip card:agent:gall state:d)
  ?~  found=(~(get by quotes.state) id)  [~ state]
  =/  q=quote:d  u.found
  =/  rid  request.q
  ::  Verification cannot move money. Settlement can: retain its nonce,
  ::  payload and phase until an author reconciles an ambiguous outcome.
  =.  q
    ?:  =(%verify stage)  q(phase %failed, payment ~, request ~)
    q(request ~)
  :_  state(quotes (~(put by quotes.state) id q))
  ?~  rid  ~
  (error:web u.rid 502 message)
::  The author records a confirmed transfer after checking its receipt.
::  This never sends a transaction or retries settlement.
++  reconcile
  |=  [id=@uv transaction=@t]
  ^-  (quip card:agent:gall state:d)
  ?>  =(src.bowl our.bowl)
  =/  q=quote:d  (need (~(get by quotes.state) id))
  ?>  =(%settling phase.q)
  ?>  ?=(^ payment.q)
  (settled id q [& transaction network.requirements.plan.q `(payer:evm u.payment.q) ~])
::  A trusted author can close an expired authorization after confirming
::  on chain that it is unused. This releases the pending-payment block.
++  dismiss
  |=  id=@uv
  ^-  (quip card:agent:gall state:d)
  ?>  =(src.bowl our.bowl)
  =/  q=quote:d  (need (~(get by quotes.state) id))
  ?>  =(%settling phase.q)
  ?>  (lte expires.q now.bowl)
  =/  closed=quote:d  q
  =.  closed  closed(phase %failed, payment ~, request ~)
  [(both:e our.bowl) state(quotes (~(put by quotes.state) id closed))]
++  sweep
  ^-  state:d
  ::  Only expired unsigned offers and verification failures are transient.
  ::  Paid receipts and ambiguous settlements remain available to reconcile.
  =/  kept
    %+  skim  ~(tap by quotes.state)
    |=  [id=@uv q=quote:d]
    ?:  ?=(?(%offered %failed) phase.q)
      (gte (add expires.q ~d1) now.bowl)
    &
  state(quotes (~(gas by *(map @uv quote:d)) kept))
++  timeout
  |=  id=@uv
  ^-  (quip card:agent:gall state:d)
  ?~  q=(~(get by quotes.state) id)  [~ state]
  ?.  ?=(?(%verifying %settling) phase.u.q)  [~ state]
  (failed id ?:(=(%verifying phase.u.q) %verify %settle) 'Payment confirmation is taking longer than expected. Check its status before paying again.')
--
