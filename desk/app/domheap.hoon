::  Gall lifecycle adapter. Product behavior lives in the libraries below.
/-  d=domheap
/+  default-agent, core=domheap-core, migrate=domheap-migrate
=|  state=state:d
^-  agent:gall
|_  =bowl:gall
+*  this  .
    def  ~(. (default-agent this %|) bowl)
    app  ~(. core [bowl state])
++  on-init
  =^  cards  state  init:app
  [[[%pass /maintenance %arvo %b %wait (add now.bowl ~m1)] cards] this]
++  on-save  !>(state)
++  on-load
  |=  saved=vase
  =.  state  (load:migrate saved)
  =^  cards  state  init:app
  [cards this]
++  on-poke
  |=  [=mark =vase]
  =^  cards  state  (poke:app mark vase)
  [cards this]
++  on-watch
  |=  =path
  =^  cards  state  (watch:app path)
  [cards this]
++  on-agent
  |=  [=wire =sign:agent:gall]
  =^  cards  state  (agent:app wire sign)
  [cards this]
++  on-arvo
  |=  [=wire =sign-arvo]
  =^  cards  state  (arvo:app wire sign-arvo)
  [cards this]
++  on-peek  on-peek:def
++  on-leave  on-leave:def
++  on-fail  on-fail:def
--
