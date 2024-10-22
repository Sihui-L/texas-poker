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
    chips: 0,
    dealer: false,
  }
}

function createPlayers(numberOfPlayers) {
  return Array(numberOfPlayers).fill('').map(initPlayer);
}

export default function Home() {
  const numberOfPlayers = 4; // TEMP
  const deckOfCards = createDeck();
  const shuffledDeck = shuffleDeck(deckOfCards);
  const players = createPlayers(numberOfPlayers);
  console.log('shuffledDeck: ', shuffledDeck);
  console.log('players: ', players);

  return '';
}
