Version 0.4 (Magic)

Enhancements:
Currency Tab:
  Add four new currencies:
  Air, Water, Earth, Fire

Market Tab:
  Add four cards:
  Air cost 10 copper
  Water cost 1 silver
  Earth cost 10 silver
  Fire cost 1 gold
  
Spin Tab:
  Add a CLAIM button between SPIN and the Log
  After the spinning animation, but before computing the result of a SPIN
  Allow the user to perform any of the following "Magic" actions:
    Respin a selected Column: Costs 1 air for first respin, 2 air for 2nd and so on
    Swap the icons of two adjacent selected cells: Costs 1 water for first move, 2 water for 2 and so on 
    Lock a selected Column: Costs 1 air for first lock, 2 for 2nd, 3 for 3rd.  Only 3 columns can be locked.  When a column is locked, it doesnt get respun on the next SPIN
    Increase Card value: Costs 1 fire for first, 2 for 2nd and so on.
  After the user finishes with their "Magic" actions, the user can press the CLAIM.  Compute the result of the slot machine, and give the earned currency as normal

Special Win Condition!
  If the slot machine contains total value of 3 air, 3 water, 3 earth, 3 fire.  Inform the user that they are "Master of Elements".  They can still continue playing afterwards.

Results Modal:
  Only display when user gains more than 20% of the currency they currently own.
  Special case: For the Gold, Silver, Copper currencies: compute it into a combined Money: 10000 * gold + 100 * silver + copper .  Use that combined money computation to determine if the modal should be displayed.  For example if player has 1 gold and 0 silver and 0 copper, earning 99 copper should not display the results modal

  