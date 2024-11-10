const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (query) => new Promise(resolve => rl.question(`${query} `, resolve));

const UNIT = 1;
const SMALL_BLIND = 1 * UNIT;
const BIG_BLIND = 2 * UNIT;

function shuffleDeck(unshuffled) {
  const shuffled = unshuffled
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  return shuffled; 
}

function createDeck() {
  const suits = ['D', 'S', 'H', 'C'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = suits.flatMap((suit) => {
    return ranks.map((rank) => `${rank}${suit}`);
  });

  return deck;
}

const initPlayer = (el, i) => ({
  id: i,
  holeCards: [],
  chips: 1000,
  dealer: false,
  hasFolded: false,
  currentBet: 0,
})

function createPlayers(numberOfPlayers) {
  return Array(numberOfPlayers).fill('').map(initPlayer);
}

function placeBet(player, amount, roundState) {
  if (player.chips < amount) {
    //TODO: handle player with not enough chips 
  }
  player.chips -= amount;
  player.currentBet = player.currentBet + amount;
  roundState.currentBet = player.currentBet;
  roundState.pot += amount;
}

function postBlinds(players, roundState) {
  // dealer posts small blind
  const { dealerIndex } = roundState;
  const smallBlindIndex = dealerIndex === players.length - 1 ? 0 : dealerIndex + 1;
  const bigBlindIndex = dealerIndex === players.length - 2 ? 0 : dealerIndex + 2;
  placeBet(players[smallBlindIndex], SMALL_BLIND, roundState);
  placeBet(players[bigBlindIndex], BIG_BLIND, roundState);
}

function dealHoleCards(players, shuffledDeck) {
  for (let i = 0; i < 2; i++) {
    for (const player of players) {
      const lastCard = shuffledDeck.pop();
      player.holeCards.push(lastCard);
    }
  }
  console.log('Hole cards are dealt.');
}

function dealCommunityCards(numberOfCards, shuffledDeck, communityCards) {
  let i = 0;
  while (i < numberOfCards) {
    const lastCard = shuffledDeck.shift();
    communityCards.push(lastCard);
    i++;
  }
}

function setDealer(players) {
  let dealerIndex = players.findIndex((player) => player.dealer);
  if (dealerIndex === -1) {
    dealerIndex = Math.floor(Math.random() * players.length);
    players[dealerIndex].dealer = true;
  } else {
    players[dealerIndex].dealer = false;

    if (dealerIndex === players.length - 1) {
      dealerIndex = 0;
      players[dealerIndex].dealer = true;
    } else {
      dealerIndex ++;
      players[dealerIndex].dealer = true;
    }
  }
  return dealerIndex
}

function initializeRound(deck, players) {
  const roundState = { pot: 0, communityCards: [], currentBet: 0 };
  roundState.deck = shuffleDeck(deck);
  roundState.dealerIndex = setDealer(players);

  postBlinds(players, roundState);
  dealHoleCards(players, roundState.deck);
  players.forEach((player) => {
    player.hasFolded = false;
    console.log(`Player ${player.id} got 2 hold cards: ${player.holeCards}`);
  });
  
  return roundState;
}

async function askPlayerAction(player) {
  let action = (await ask(`Action for player ${player.id}?`)).trim().toLowerCase() || 'call';
  while (action !== 'call' && action !== 'raise' && action !== 'check' && action !== 'fold') {
    action = (await ask(`Invalid action. Please enter call, raise, check, or fold.`)).trim().toLowerCase();
  }
  return action;
} 

async function askRaiseAmount(player, currentBet) {
  let amount = parseFloat(await ask(`Raise player ${player.id}'s bet to?`));
  while (isNaN(amount) || amount < currentBet || amount > player.chips) {
    amount = Number(await ask(`Invalid amount. Please enter an amount that's greater than current bet ${currentBet} and that you can afford.`));
  }
  return amount;
}

async function handlePlayerAction(players, roundState) {
  for (const player of players) {
    const action = await askPlayerAction(player);
    switch(action) {
      case 'call':
        if (player.chips > roundState.currentBet) placeBet(player, roundState.currentBet - player.currentBet, roundState);
        break;
      case 'raise':
        const raiseAmount = await askRaiseAmount(player, roundState.currentBet);
        placeBet(player, raiseAmount - player.currentBet, roundState);
        break;
      case 'check':

        break;
      case 'fold':
        player.hasFolded = true;
        break;
    }
  }
}

// first to act = small blind
function initialseBettingRound(players, roundState) {
  roundState.currentBet = 0;
  for (const player of players) {
    player.currentBet = 0; s
  }
};

async function handleBettingRound(players, roundState) {
  // ends either when everyone but 1 person has folded or everyone who hasnt folded has called
  // roundState.currentBet = 4
  // players = [ {id: 1, currentBet: 3}, {id: 2, currentBet: 3}, {id: 3, currentBet: 3 } ]
  while (
    !players.filter(p => !p.hasFolded).every(p => p.currentBet === roundState.currentBet) &&
    players.filter(p => !p.hasFolded).length > 1
  ) {
    for (const player of player) {
      if (player.currentBet < roundState.currentBet) {
        const action = handlePlayerAction(player, roundState); // call, raise, fold, check
      }
    }
  }
}

// export default async function Home() {
async function Home() {
  const numberOfPlayers = 4; // TEMP
  const deckOfCards = createDeck();
  const players = createPlayers(numberOfPlayers);

  while (players.length > 1) {
    // initiate - shuffle deck, blinds, and dealer
    const roundState = initializeRound(deckOfCards, players);
    // Pre-flop betting round
    handleBettingRound(players, pot, lastBet);
    if (roundState.players.length > 1) {
      // Flop, Turn, River rounds
      const numberOfCCForEachRound = [3, 1, 1];
      for (const number of numberOfCCForEachRound) {
        initialseBettingRound(players, roundState);
        dealCommunityCards(number, roundState.deck, roundState.communityCards);
        console.log('communityCards: ', roundState.communityCards);
        handleBettingRound(players, pot, lastBet);
        if (roundState.players.length > 1) continue
        else break;
        // // Bet - only if there're more than 1 active players
        // if (players.filter((p) => !p.fold).length > 1) {
        //   [pot, roundState.currentBet] = await bet(players, pot, roundState.currentBet);
        // } else {
        //   break;
        // }
    
        console.log(`Pot: ${pot}`);
      }
    }

    players = players.filter(p => p.chips)
  }

  // return '';
}

Home();