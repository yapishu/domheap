::  Split the bytes before encoding any public representation. This also
::  catches markers inside Markdown constructs: concealment fails closed.
::  The delimiter itself is never sent to the renderer.
|%
++  split
  |=  body=@t
  ^-  [preview=@t remainder=(unit @t)]
  =/  text=tape  (trip body)
  ?~  at=(find "<<<paywall>>>" text)  [body ~]
  [(crip (scag u.at text)) `(crip (slag (add 13 u.at) text))]
++  readable
  |=  [body=@t allowed=?]
  ^-  [text=@t locked=?]
  =/  parts  (split body)
  ?~  remainder.parts  [preview.parts |]
  ?.  allowed  [preview.parts &]
  [(cat 3 preview.parts u.remainder.parts) |]
--
