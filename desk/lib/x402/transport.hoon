::  Small Iris adapter. Pass a private wire and process its terminal response.
::  Redirects are disabled so a configured facilitator cannot forward a
::  signed payment to an unrelated endpoint. TLS or loopback is required.
/-  x=x402
/+  p=x402-protocol
|%
++  starts
  |=  [prefix=@t text=@t]
  =(prefix (cut 3 [0 (met 3 prefix)] text))
++  valid-url
  |=  url=@t
  ^-  ?
  ?|  (starts 'https://' url)
      (starts 'http://127.0.0.1:' url)
      (starts 'http://localhost:' url)
  ==
++  request
  |=  [base=@t method=?(%verify %settle) payment=payment:x requirements=requirements:x]
  ^-  request:http
  ?>  (valid-url base)
  :*  %'POST'
      (cat 3 base (cat 3 '/' method))
      ~[['content-type' 'application/json'] ['accept' 'application/json']]
      `(as-octs:mimes:html (en:json:html (facilitator-body:p payment requirements)))
  ==
++  card
  |=  [=wire base=@t method=?(%verify %settle) payment=payment:x requirements=requirements:x]
  ^-  card:agent:gall
  [%pass wire %arvo %i %request (request base method payment requirements) [0 0]]
--
