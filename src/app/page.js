const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (query) => new Promise(resolve => rl.question(`${query} `, resolve));

async function askBoolean(question, defaultAns = false) {
  const inputAnswer = (await ask(`${question} [yes|no]`)).trim().toLowerCase();

  const answer = inputAnswer === 'yes' || inputAnswer === 'no'
    ? inputAnswer === 'yes'
    : defaultAns;

  return answer;
}

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
  hasAllIn: false,
  currentBet: 0,
})
// TODO: make Player a class, and add method "makeBet" to it

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
  // The person to the left of the dealer posts small blind
  const { dealerIndex } = roundState;
  const smallBlindIndex = dealerIndex === players.length - 1 ? 0 : dealerIndex + 1;
  const bigBlindIndex = dealerIndex === players.length - 2 ? (dealerIndex === players.length - 1 ? 1 : 0) : dealerIndex + 2;

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
    player.hasAllIn = false;
    console.log(`Player ${player.id} got 2 hold cards: ${player.holeCards}`);
  });
  
  return roundState;
}

// first to act = small blind
function initialseBettingRound(players, roundState) {
  roundState.currentBet = 0;
  for (const player of players) {
    player.currentBet = 0;
  }
};

async function askPlayerAction(player, someoneHasBetted) {
  let action = (await ask(`Action for player ${player.id}?`)).trim().toLowerCase() || 'call';
  while (!['call', 'raise', 'check', 'fold'].includes(action)) {
    action = (await ask(`Invalid action. Please enter call, raise, check, or fold.`)).trim().toLowerCase();
  }
  while (action === 'check' && someoneHasBetted) {
    action = (await ask(`Invalid action. Someone has made bet, please enter call, raise, or fold.`)).trim().toLowerCase();
    if (['call', 'raise'].includes(action)) someoneHasBetted = true;
  }

  return [action, someoneHasBetted];
} 

async function askRaiseAmount(player, currentBet) {
  let amount = parseFloat(await ask(`Raise player ${player.id}'s bet to?`)).trim().toLowerCase();
  while (isNaN(amount) || amount < currentBet || amount > player.chips) {
    amount = Number(await ask(`Invalid amount. Please enter an amount that's greater than current bet ${currentBet} and that you can afford.`)).trim().toLowerCase();
  }
  return amount;
}

async function handlePlayerAction(player, roundState, someoneHasBetted) {
  let action;

  [action, someoneHasBetted] = await askPlayerAction(player, someoneHasBetted);
  switch(action) {
    case 'call':
      if (player.chips > roundState.currentBet) placeBet(player, roundState.currentBet - player.currentBet, roundState);
      else {
        const ans = await askBoolean('The amount of chips you have is less than current bet, do you want to all in?');
        // if ans = all-in
      }
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

async function handleBettingRound(players, roundState) {
  // ends either when everyone but 1 person has folded or everyone who hasnt folded has called
  // roundState.currentBet = 4
  // players = [ {id: 1, currentBet: 3}, {id: 2, currentBet: 3}, {id: 3, currentBet: 3 } ]
  let someoneHasBetted = false; //WIP
  while (
    !players.filter(p => !p.hasFolded).every(p => p.currentBet === roundState.currentBet) &&
    players.filter(p => !p.hasFolded).length > 1
  ) {
    for (const player of players) {
      if (!player.hasAllIn) {
        const action = await handlePlayerAction(player, roundState); // call, raise, fold, check
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
    await handleBettingRound(players, roundState);
    if (roundState.players.length > 1) {
      // Flop, Turn, River rounds
      const numberOfCCForEachRound = [3, 1, 1];
      for (const number of numberOfCCForEachRound) {
        initialseBettingRound(players, roundState);
        dealCommunityCards(number, roundState.deck, roundState.communityCards);
        console.log('communityCards: ', roundState.communityCards);

        await handleBettingRound(players, roundState);
        if (roundState.players.length > 1) continue;
        else break;
      }
    }

    players = players.filter(p => p.chips);
  }
}

Home();