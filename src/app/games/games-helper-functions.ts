import { GameFormat } from './pinochle-scoreboard/interfaces/gameformat.interface';
import { GameSettings } from './pinochle-scoreboard/interfaces/gamesettings.interface';
import { Team } from './pinochle-scoreboard/interfaces/team.interface';
const FIVE_HAND = '5-hand';

export function isValidNumber(val: number): boolean {
  return val !== null && !isNaN(val);
}

export function formatSubScore(val: number): string | number {
  return val >= 0 ? `+${val}` : val;
}

export function getDeepCopy(val: any): any {
  return !val ? null : JSON.parse(JSON.stringify(val));
}

export function showTeamInput5Hand(
  i: number,
  gameFormat: GameFormat,
  bidWinnerIndices: number[],
  nonBidWinnerIndices: number[]
): boolean {
  if (gameFormat?.label !== FIVE_HAND) {
    return true;
  }
  return bidWinnerIndices[0] == i || nonBidWinnerIndices[0] == i;
}

export function hasDecimal(num: number): boolean {
  return num.toString().includes('.');
}

export function getTeamComboName5Hand(
  i: number,
  gameFormat: GameFormat,
  bidWinnerIndices: number[],
  nonBidWinnerIndices: number[],
  teams: Team[]
): string {
  if (gameFormat?.label !== FIVE_HAND) {
    return teams[i]?.name;
  }
  if (bidWinnerIndices[0] == i) {
    return (
      teams[bidWinnerIndices[0]].name + ' & ' + teams[bidWinnerIndices[1]]?.name
    );
  } else {
    let comboName: string = '';
    nonBidWinnerIndices.forEach((index) => {
      comboName += comboName.length
        ? ' & ' + teams[index].name
        : teams[index].name;
    });
    return comboName;
  }
}

export function getDefaultPinochleSettings(): GameSettings {
  return {
    autoCalculate: true,
    showPrimaryBidWinnerForFiveHand: false,
    customTrickPoints: {
      '3-hand': null,
      '4-hand': null,
      '5-hand': null,
      '6-hand': null,
      '8-hand': null,
    },
  };
}

export function getDefaultPinochleFormats(): GameFormat[] {
  return [
    {
      label: '3-hand',
      description: '3 teams of 1 player',
      teamCount: 3,
      possibleTrickPoints: 250,
    },
    {
      label: '4-hand',
      description: '2 teams of 2 players',
      teamCount: 2,
      possibleTrickPoints: 250,
    },
    {
      label: '5-hand',
      description: '5 teams of 1 player',
      teamCount: 5,
      possibleTrickPoints: 500,
    },
    {
      label: '6-hand',
      description: '2 teams of 3 players',
      teamCount: 2,
      possibleTrickPoints: 500,
    },
    {
      label: '8-hand',
      description: '4 teams of 2 players',
      teamCount: 4,
      possibleTrickPoints: 500,
    },
  ];
}

export function formatTimestampForPinochle(timestamp: number): string {
  const date = new Date(timestamp);

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${formattedHours}:${formattedMinutes} ${ampm} on ${month} ${day}, ${year}`;
}

export function getPinochleAddedScore(team: Team): number {
  return team.currentTotalScore + team.roundSubTotal;
}

export function getRandomPinochleTeamName(
  gameFormat: GameFormat,
  takenNames: string[] = []
): string {
  const { label } = gameFormat || {};
  let namePool: string[] = [];

  switch (label) {
    case '3-hand':
    case '5-hand':
      namePool = soloNames;
      break;
    case '4-hand':
    case '8-hand':
      namePool = duoNames;
      break;
    case '6-hand':
      namePool = trioNames;
      break;
    default:
      throw new Error('Not a valid game format');
  }
  const availableNames = namePool.filter((name) => !takenNames.includes(name));
  if (availableNames.length === 0) {
    throw new Error('No available names left to generate.');
  }
  const randomIndex = Math.floor(Math.random() * availableNames.length);
  return availableNames[randomIndex];
}

const soloNames = [
  "Mr. Steal Yo Meld",
  "Ace",
  "Wildcard",
  "Lone Wolf",
  "Solo Star",
  "Maverick",
  "The One",
  "Card Shark",
  "Solo Ace",
  "Lone Hand",
  "Big Deal",
  "High Roller",
  "The Dealer",
  "Silent Hand",
  "Solo Victory",
  "The Gambler",
  "Sharp Dealer",
  "Single Snap",
  "Last Stand",
  "Table King",
  "Pocket Ace",
  "Ace Hunter",
  "Card Whisperer",
  "Lonely Joker",
  "Rogue Ace",
  "The Drifter",
  "Bluff Master",
  "One Trick",
  "Silent Star",
  "Card Cowboy",
  "Solo Champ",
  "The Underdog",
  "Table Titan",
  "Lone Star",
  "Loner Legend",
  "Risk Taker",
  "The Shuffler",
  "Lone Dealer",
  "Royal Flush",
  "Card Phantom",
  "Jack of None",
  "The Misfit",
  "Deck Diver",
  "One-Timer",
  "Shuffle Ace",
  "Solo Hustler",
  "The Jokester",
  "Big Talker",
  "Deal Destroyer",
  "Lone Stranger",
  "Ace of Hearts",
  "The Outlier",
  "Last Card",
  "Lucky Shot",
  "One and Done",
  "Stack Master",
  "Solo Wizard",
  "Card Crafter",
  "The Joker",
  "Ace in Hand",
  "Mystic Ace",
  "Deck Master",
  "Lone Legend",
  "The Fumbler",
  "Full Bluff",
  "Unshuffled",
  "Sharp Hand",
  "Solo Streak",
  "One Card King",
  "Lone Gambler",
  "Silent Dealer",
  "Ace of Bluff",
  "The Loner",
  "Shuffled Out",
  "Pocket King",
  "One Out",
  "Rogue Dealer",
  "Final Hand",
  "Single Strike",
  "Lucky Ace",
  "Table Hopper",
  "The Risker",
  "Silly Goose",
  "Li'l Tricker"
];

const duoNames = [
  "Dynamic Duo",
  "Card Sharks",
  "Twisted Pair",
  "Double Trouble",
  "Bluff Brothers",
  "Lucky Pair",
  "Tag Team",
  "Deal Makers",
  "Twin Flames",
  "Paired Aces",
  "Royal Pair",
  "Two Kings",
  "Twin Jokers",
  "Wild Jokers",
  "Perfect Pair",
  "Deuces Wild",
  "Bluff Buddies",
  "Jack & Jill",
  "Two Queens",
  "Two of Hearts",
  "Twin Stars",
  "Double Dealers",
  "Daring Duo",
  "Paired Up",
  "Ace Pair",
  "Two Jokesters",
  "Dual Threat",
  "Royal Duo",
  "Double Bluffers",
  "Twin Spades",
  "Duo Hustlers",
  "Duo Renegades",
  "Two Tricksters",
  "Twin Jokers",
  "Pair of Fools",
  "Bluff Twins",
  "Ace Hunters",
  "Deal Dodgers",
  "Sharp Jokers",
  "Two-for-One",
  "Suit Squad",
  "Double Jokers",
  "Hawks",
  "Wolves",
  "Vipers",
  "Cobras",
  "Cougars",
  "Panthers",
  "Wildcats",
  "Falcons",
  "Grizzlies",
  "Crows",
  "Ravens",
  "Eagles",
  "Jaguars",
  "Savages",
  "Firehawks",
  "Bullfrogs",
  "Night Wolves",
  "Storm Hawks",
  "Iron Jokers",
  "Trailblazers",
  "Chaos Pair",
  "Ace Chasers",
  "Thunderbirds",
  "Lightning Duo",
  "Shadow Pair",
  "Royal Wreckers",
  "Hellcats",
  "Blazing Stars",
  "Double Agents",
  "Frost Wolves",
  "Card Crushers",
  "Steel Cobras",
  "Red Hawks",
  "Golden Panthers",
  "Savage Sharks",
  "Silver Jokers",
  "Stormchasers",
  "Triumph Twins",
  "Raging Aces",
  "Ghost Duo",
  "Only Kings",
  "Only Queens",
  "Only Aces",
  "Only Jacks",
];

const trioNames = [
  'Sharks',
  'Musketeers',
  'Three of Hearts',
  'Full House',
  'Chaos Crew',
  'Jack-less Jokers',
  'Wolves',
  'Panthers',
  'Tragic Trio',
  'Crows',
  'Ravens',
  'Vipers',
  'Eagles',
  'Tigers',
  'Barracudas',
  'Wildcats',
  'Falcons',
  'Grizzlies',
  'Cobras',
  'Jaguars',
  'Coyotes',
  'Rhinos',
  'Cougars',
  'Card Sharks',
  'Bluff Busters',
  'Suit Squad',
  'Royal Jokers',
  'Kingslayers',
  'Deck Destroyers',
  'Tri-Wrecks',
  'Card Crusaders',
  'Triple Jokers',
  'Triple Trouble',
  'Triple Threat',
  'Ace Hunters',
  'Chaos Kings',
  'Rule Breakers',
  'Deck Crashers',
  'Card Hustlers',
  'Joker Kings',
  'Ace Band',
  'Lucky Charms',
  'Shuffle Squad',
  'Wrecking Crew',
  'Royal Renegades',
  'Flush Crushers',
  'Wild Jokers',
  'Ace Chasers',
  'Bluff Masters',
  'Deal Stealers',
  'Tri Rebels',
  'Outlaws',
  'Savages',
  'Wildcards',
  'Renegades',
  'Bullfrogs',
  'Marauders',
  'Firehawks',
  'Nightcrawlers',
  'Thunderbirds',
  'Shadow Wolves',
  'Storm Riders',
  'Vortex',
  'Wild Spirits',
  'Trailblazers',
  'Lightning',
  'Phoenixes',
  'Direwolves',
  'Red Hawks',
  'Iron Fangs',
  'Dark Riders',
  'Black Panthers',
  'Bone Crushers',
  'Predators',
  'Raptors',
  'Silverbacks',
  'Raging Rhinos',
  'Sharks',
  'Falcons',
  'Ghost Riders',
  'Ice Wolves',
  'Coyotes',
  'Stormchasers',
  'Fire Panthers',
  'Steel Vipers',
  'Frost Hawks',
  ' obras',
];
