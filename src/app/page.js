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

  return pot;
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

function sortPlayers (players) {
  players.sort((a, b) => b.dealer - a.dealer);
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

  sortPlayers(players);

  let pot = 0;
  pot = postBlinds(players, dealerIndex, pot);
  console.log(`Pot: ${pot}`);
  dealHoleCards(players, shuffledDeck);
  players.forEach((player) => {
    console.log(`Player ${player.id} got 2 hold cards: ${player.holeCards}`);
  });
  
  return [shuffledDeck, pot];
}

async function bet(players, pot, lastBet = 2) {
  sortPlayers(players);

  for (const player of players) {
    const action = (await ask(`Action for player ${player.id}?`)).trim().toLowerCase() || 'call';
    console.log('action: ', action);
    if (action === 'raise') {
      let ans;
      do {
        ans = Number(await ask(`Raise bet to? (must be above previous bet ${lastBet}): `)) || 0;
      } while (ans <= lastBet);
      lastBet = ans;
    }

    if (!player.fold) {
      if (['raise', 'call'].includes(action)) {
        player.chips -= lastBet;
        pot += lastBet;
        console.log(`Pot: ${pot}`);
      } else if (action === 'fold') {
        player.fold = true;
        player.holdCards = [];
        if (player.dealer) {
          let newDealerIndex;
          if (player.id === players.length - 1) newDealerIndex = 0;
          else newDealerIndex = player.id + 1; 
          players[newDealerIndex].dealer = true;
          player.dealer = false;
        }
      }
    }
  }

  return [pot, lastBet];
}

// export default async function Home() {
async function Home() {
  const numberOfPlayers = 4; // TEMP
  const deckOfCards = createDeck();
  const players = createPlayers(numberOfPlayers);

  // initiate - shuffle deck, blinds, and dealer
  let [shuffledDeck, pot] = initializeRound(deckOfCards, players);

  // Pre-flop betting round
  let lastBet;
  if (players.length !== 2) {
    const playersToBet = players.slice(2);
    [pot, lastBet] = await bet(playersToBet, pot);
  }

  // Flop, Turn, River rounds
  const numberOfCCForEachRound = [3, 1, 1];
  const communityCards = [];
  for (const number of numberOfCCForEachRound) {
    // Deal community cards
    dealCommunityCards(number, shuffledDeck, communityCards);
    console.log('communityCards: ', communityCards);

    // Bet - only if there're more than 1 active players
    if (players.filter((p) => !p.fold).length > 1) {
      [pot, lastBet] = await bet(players, pot, lastBet);
    } else {
      break;
    }

    console.log(`Pot: ${pot}`);
  }

  // return '';
}

Home();