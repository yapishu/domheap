::  The publisher owns access. A reader's assertion of membership is never
::  an input to this gate. Expiry is checked at the moment of each read.
/-  d=domheap
|%
++  allowed
  |=  [owner=@p reader=@p now=@da members=members:d]
  ^-  ?
  ?:  =(owner reader)  &
  ?~  member=(~(get by members) reader)  |
  ?~  expires.u.member  &
  (gth u.expires.u.member now)
++  extend
  |=  [now=@da duration=@dr previous=(unit @da)]
  ^-  @da
  (add (max now (fall previous now)) duration)
--
