::  Author mutations are explicit and bounded. The caller establishes local
::  ownership before entering this door; remote identities cannot reach it.
/-  d=domheap, n=notes
/+  j=x402-json, a=domheap-access, nb=domheap-notes, e=domheap-events
/+  xt=x402-transport, evm=x402-evm, pay=domheap-payments
|=  [=bowl:gall state=state:d]
|%
++  string
  |=  [obj=json key=@t limit=@ud]
  ^-  @t
  =/  value  (text:j (field:j obj key))
  ?>  (lte (met 3 value) limit)
  value
++  run
  |=  data=json
  ^-  (quip card:agent:gall state:d)
  ?>  =(our.bowl src.bowl)
  =/  op  (text:j (field:j data 'op'))
  ?+  op  ~|('Unknown author action.' !!)
      %configure
    =/  name=@t  (string data 'notebook' 128)
    =/  title  (string data 'title' 160)
    ?>  !=('' title)
    =/  source=(unit @tas)  ?:  =('' name)  ~
      `(slav %tas name)
    =/  notebook  (nb bowl publication.state)
    ?>  ?~(source & (select:notebook u.source))
    =/  p=publication:d
      :*  title
          (string data 'description' 500)
          (string data 'about' 100.000)
          (string data 'avatar' 2.048)
          (string data 'cover' 2.048)
          source
      ==
    =/  cards=(list card:agent:gall)
      ?:  =(notebook.publication.state source)  ~
      =/  leave=(list card:agent:gall)
        ?.  (~(has by wex.bowl) [/notebook our.bowl %notes])  ~
        ~[[%pass /notebook %agent [our.bowl %notes] %leave ~]]
      (weld leave watch:(nb bowl p))
    [(weld cards (both:e our.bowl)) state(publication p)]
      %grant
    =/  who  (slav %p (string data 'ship' 128))
    =/  days  (number:j (field:j data 'days'))
    ?>  (lte days 36.500)
    =/  expiry=(unit @da)  ?:  =(0 days)  ~
      `(add now.bowl (mul days ~d1))
    [(both:e our.bowl) state(members (~(put by members.state) who [expiry %gift]))]
      %revoke
    =/  who  (slav %p (string data 'ship' 128))
    [(both:e our.bowl) state(members (~(del by members.state) who))]
      %follow
    =/  who  (slav %p (string data 'ship' 128))
    ?>  !=(who our.bowl)
    ?>  (lth (lent ~(tap in following.state)) 256)
    :_  state(following (~(put in following.state) who))
    :~  [%pass /follow/(scot %p who) %agent [who %domheap] %watch /v1/changes]
        (changed:e who)
    ==
      %unfollow
    =/  who  (slav %p (string data 'ship' 128))
    :_  state(following (~(del in following.state) who))
    :~  [%pass /follow/(scot %p who) %agent [who %domheap] %leave ~]
        (changed:e who)
    ==
      %close-payment
    (dismiss:(pay bowl state) (slav %uv (string data 'id' 128)))
      %reconcile
    =/  id  (slav %uv (string data 'id' 128))
    (reconcile:(pay bowl state) id (string data 'transaction' 128))
      %payments
    =/  enabled  (boolean:j (field:j data 'enabled'))
    ?:  &(!enabled =(~ (optional:j data 'prices')))
      [(both:e our.bowl) state(plan (bind plan.state |=(p=plan:d p(enabled |))))]
    =/  base  (string data 'facilitator' 2.048)
    =/  origin  (string data 'origin' 2.048)
    =/  decimals  (number:j (field:j data 'decimals'))
    ?>  (lte decimals 18)
    =/  rates  (field:j data 'prices')
    =/  prices=prices:d
      [(string rates 'day' 80) (string rates 'week' 80) (string rates 'month' 80) (string rates 'year' 80)]
    =/  amounts=(list @t)  ~[day.prices week.prices month.prices year.prices]
    ?>  (levy amounts |=(amount=@t (gth (need (rush amount dem)) 0)))
    =/  req  (de-requirements:j (field:j data 'requirements'))
    =.  req  req(amount month.prices)
    ?.  enabled
      [(both:e our.bowl) state(plan `[| base origin decimals prices req])]
    ?>  &((valid-url:xt base) (valid-url:xt origin))
    ?>  &(!=('/' (rear (trip base))) !=('/' (rear (trip origin))))
    ?>  =('exact' scheme.req)
    ?>  (starts:xt 'eip155:' network.req)
    ?>  (gth (need (rush (crip (slag 7 (trip network.req))) dem)) 0)
    ?>  &((valid-hex:evm 20 asset.req) (valid-hex:evm 20 pay-to.req))
    ?>  !=('' (text:j (field:j extra.req 'name')))
    ?>  !=('' (text:j (field:j extra.req 'version')))
    =/  method  (optional:j extra.req 'assetTransferMethod')
    ?>  ?~(method & =('eip3009' (text:j u.method)))
    =.  req  req(amount month.prices)
    ?>  &((gth timeout.req 0) (lte timeout.req 3.600))
    ::  Domheap's wallet UI signs EIP-3009 exact payments; the underlying
    ::  x402 library remains agnostic to scheme and network.
    [(both:e our.bowl) state(plan `[& base origin decimals prices req])]
  ==
--
