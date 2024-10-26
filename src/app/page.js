const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (query) => new Promise(resolve => rl.question(`${query} `, resolve));

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

function initPlayer(el, i) {
  return {
    holeCards: [],
    id: i,
    chips: 1000,
    dealer: false,
    fold: false,
  }
}

function createPlayers(numberOfPlayers) {
  return Array(numberOfPlayers).fill('').map(initPlayer);
}

function postBlinds(players, dealerIndex, pot) {
  // dealer posts small blind
  players[dealerIndex].chips --;
  pot++;
  // next player posts big blind
  if (dealerIndex === players.length - 1) {
    players[0].chips -= 2;
  } else {
    players[dealerIndex + 1].chips -= 2;
  }
  pot += 2;
}

function dealHoleCards(players, shuffledDeck) {
  let i = 0;
  while (i < 2) {
    for (const player of players) {
      const lastCard = shuffledDeck.shift();
      player.holeCards.push(lastCard);
    }
    i++;
  }
}

function initializeRound(deck, players) {
  const shuffledDeck = shuffleDeck(deck);
  let dealerIndex = players.findIndex((player) => player.dealer);
  if (dealerIndex === -1) {
    dealerIndex = Math.floor(Math.random() * players.length);
    players[dealerIndex].dealer = true;
  } else {
    players[dealerIndex].dealer = false;

    if (dealerIndex === players.length - 1) {
      players[0].dealer = true;
      dealerIndex = 0;
    } else {
      players[dealerIndex + 1].dealer = true;
      dealerIndex ++;
    }
  }

  const pot = 0;
  postBlinds(players, dealerIndex, pot);
  dealHoleCards(players, shuffledDeck);

  return [shuffledDeck, pot];
}

async function bet(players, action, pot, lastBet) {
  const action = (await ask('Action?')).trim().toLowerCase() ?? 'call';
  if (action === 'raise') lastBet = (await ask('Raise bet to?')).trim().toLowerCase() ?? lastBet;

  for (const player of players) {
    if (!player.fold) {
      if (action === 'call') {
        player.chips -= lastBet;
        pot += lastBet;
      } else if (action === 'raise') {
        player.chips -= lastBet;
        pot += lastBet;
      } else if (action === 'fold') {
        player.fold = true;
        if (player.dealer) 
        player.holdCards = [];
      }
    }
  }

  return lastBet;
}

export default async function Home() {
  const numberOfPlayers = 4; // TEMP
  const deckOfCards = createDeck();
  const players = createPlayers(numberOfPlayers);

  // initiate - shuffle deck, blinds, and dealer
  const [shuffledDeck, pot] = initializeRound(deckOfCards, players);
  // console.log('shuffledDeck: ', shuffledDeck);
  // console.log('pot: ', pot);

  // Pre-flop betting round
  let lastBet = 2;
  // act based on previous bet
  lastBet = await bet(players, action, pot, lastBet);

  return '';
}
