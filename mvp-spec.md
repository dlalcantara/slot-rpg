I'm building a GitHub Pages game using HTML/CSS/JavaScript (React preferred but not required).

Game Concept

A slot machine game where players generate different currencies from icons in the machine.  Each currency has a different effect on the game, eventually reacing a win condition.

Visual is minimalist, but will be replaced with simple image icons.  For the MVP, placeholder text is used, but layout should be prepared to insert 16x16 or 32x32 png images.  Mobile resolution should be supported (720x1280 px)

CORE MECHANICS:

* Slot Machine
  * 3 rows x 5 column matrix of icons
  * On SPIN, Icons are populated through randomized reel of icons (explained below)
  * Ideally SPIN of icons is animated for 5 seconds, but not required
  * If an icon appears in all 5 columns, the amount of currency gained for that icon is the product of the counts of that icon in each column.    
    Default Minimum: 1 (1x1x1x1x1) 
    Default Maximum: 243 (3x3x3x3x3)

* Reel
  * The player's base Reel is a collection of icons.
  * When the slot machine SPIN is triggered
    * For each column:
      * Generate a copy of the base Reel, with random ordering
      * "Animate" the column, by iterating through possible offsets.  Icon at indices offset, offset+1, and offset+2 will be displayed.  Offset should wrap around, indices should also wrap around if beyond the reel size
      * Finalize the icons for that column by stopping at a given offset.

* Currencies:
  * Food
    * Denoted by Apples
    * Starts at 100
    * Every spin decreases food by 1
    * If food reaches zero AFTER a spin, the game ends.

  * Money
    * Denoted by Copper, Silver, Gold
    * 100 copper is automatically converted to 1 silver
    * 100 silver is automatically converted to 1 gold
    * Starts at 0,0,0

  * Prestage
    * Denoted by Crowns
    * Starts at 0
    * Player wins when 100 Crowns are reached

* Market
  * Before and After each SPIN, the player can buy Icon's from the market
  * Buying an icon adds it to the base Reel, affecting future SPIN
  * Icons found in the Market have no limit, players can buy as many as they want as long as they have money

* Icons in the Market:
  * Apple
    Effect: 1 Apple
    Cost: 1 copper
  * Triple Apple
    Effect: 3 Apples (Same icon as apple, but is worth 3 when counting the sum of Apples for that column)
    Cost: 1 silver
  * Dozen Apples
    Effect: 12 Apples (Same icon as apple, but is worth 12 when counting the sum of Apples for that column)
    Cost: 1 gold
  * Copper
    Effect: 1 Copper
    Cost: 1 Copper
  * Silver
    Effect: 1 Silver (Does not match icons with Copper or Gold)
    Cost: 1 silver
  * Gold
    Effect: 1 Gold
    Cost: 1 Gold
  * Crown
    Effect: 1 Crown
    Cost 10 Gold

GAME LOSS
* The game ends when the player has 0 Food

GAME WIN
* Display a WIN modal when the player reaches 100 crowns.  The player can choose to continue playing afterwards.
    