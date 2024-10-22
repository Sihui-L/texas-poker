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
  console.log('players after blinds: ', players);
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
  console.log('players after hold cards: ', players);
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

  // Big blinds = 2 chips, small blinds = 1 chip
  console.log('players before blinds: ', players);
  postBlinds(players, dealerIndex, pot);

  // deal hole cards
  dealHoleCards(players, shuffledDeck);

  return [shuffledDeck, pot];
}

export default function Home() {
  const numberOfPlayers = 4; // TEMP
  const deckOfCards = createDeck();
  const players = createPlayers(numberOfPlayers);

  // initiate - shuffle deck, blinds, and dealer
  // initializeRound(deckOfCards, players);
  const [shuffledDeck, pot] = initializeRound(deckOfCards, players);
  console.log('shuffledDeck: ', shuffledDeck);
  console.log('pot: ', pot);

  return '';
}
