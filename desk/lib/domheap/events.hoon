::  Live subscriptions carry invalidations only. They never carry article
::  text, so a subscriber must fetch again and pass the current ACL check.
|%
++  changed
  |=  host=@p
  ^-  card:agent:gall
  :^  %give  %fact
    ~[/updates]
  [%json !>((pairs:enjs:format ~[['host' s+(scot %p host)]]))]
++  peer-changed
  ^-  card:agent:gall
  [%give %fact ~[/v1/changes] [%json !>(`json`[%b &])]]
++  both
  |=  host=@p
  ^-  (list card:agent:gall)
  ~[(changed host) peer-changed]
--
