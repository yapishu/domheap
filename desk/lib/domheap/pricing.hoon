::  Publication terms use explicit durations. Prices are independent exact
::  token amounts; proration is an authoring convenience in the settings UI.
/-  d=domheap
|%
++  days
  |=  period=period:d
  ^-  @ud
  ?-  period
    %day  1
    %week  7
    %month  30
    %year  365
  ==
++  amount
  |=  [prices=prices:d period=period:d]
  ^-  @t
  ?-  period
    %day  day.prices
    %week  week.prices
    %month  month.prices
    %year  year.prices
  ==
++  period
  |=  text=@t
  ^-  period:d
  ?+  text  ~|('Choose day, week, month, or year.' !!)
    %day  %day
    %week  %week
    %month  %month
    %year  %year
  ==
--
