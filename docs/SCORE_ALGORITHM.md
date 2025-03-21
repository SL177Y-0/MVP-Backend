# Score Calculation Algorithm

## Overview

The score calculation algorithm evaluates a user's digital presence across multiple platforms and assigns a comprehensive score along with badges and titles. The algorithm considers three main domains:

1. **Social Media (Twitter)**
2. **Blockchain/Crypto Activity**
3. **Community Engagement (Telegram)**

## Scoring Components

### 1. Twitter (Social Score)

| Metric | Weight | Description |
|--------|--------|-------------|
| Followers | 0.001 | Points per follower |
| Retweets | 0.005 | Points per retweet |
| Quotes | 0.005 | Points per quote |
| Replies | 0.002 | Points per reply |
| Engagement | 0.0001 | Points per engagement |
| Verification | 5 | Bonus points for verified accounts |
| Tweet Frequency | 0.001 | Points based on tweet frequency |
| Subscriptions | 2 | Points per subscription |
| Account Age | 0.1 | Points per month since account creation |
| Media | 0.01 | Points per media item |
| Pinned | 5 | Bonus for having a pinned tweet |
| Friends | 0.001 | Points per friend (following) |
| Listed | 0.01 | Points per list inclusion |
| Super Follow | 5 | Bonus for super follow feature |

### 2. Blockchain (Crypto Score + NFT Score)

| Metric | Weight | Description |
|--------|--------|-------------|
| Active Chains | 5 | Points per blockchain network used |
| Native Balance | 10 | Points based on native token balance |
| Token Holdings | 2 | Points per token type held |
| NFT Holdings | 5 | Points per NFT held |
| DeFi Positions | 5 | Points per DeFi position |
| Web3 Domains | 5 | Points per web3 domain owned |
| Transaction Count | 0.01 | Points per transaction |
| Unique Token Interactions | 1 | Points per unique token interacted with |

### 3. Telegram (Community Score)

| Metric | Weight | Description |
|--------|--------|-------------|
| Group Count | 2 | Points per group membership |
| Message Frequency | 0.1 | Points based on message frequency |
| Pinned Messages | 5 | Points per pinned message |
| Media Messages | 2 | Points per media message |
| Hashtags | 1 | Points per hashtag used |
| Polls | 2 | Points per poll created |
| Leadership | 5 | Points for leadership roles |
| Bot Interactions | 1 | Points per bot interaction |
| Sticker Messages | 0.5 | Points per sticker message |
| GIF Messages | 0.5 | Points per GIF message |
| Mention Count | 1 | Points per mention of others |

## Badge Assignment

Badges are awarded based on threshold values for specific metrics. For example:

### Twitter-related Badges

- **Influence Investor**: Followers count > 1,000
- **Tweet Trader**: Statuses count > 1,000
- **Engagement Economist**: Engagement ratio > 0.01
- **Media Mogul**: Media count > 50
- **Verified Visionary**: Account is verified

### Blockchain-related Badges

- **Chain Explorer**: Active on multiple blockchains
- **Token Holder**: Holds multiple token types
- **NFT Networker**: Owns multiple NFTs
- **DeFi Drifter**: Has DeFi positions
- **Transaction Titan**: High transaction count

### Telegram-related Badges

- **Group Guru**: Member of multiple groups
- **Message Maestro**: Sends frequent messages
- **Community Leader**: Has admin roles
- **Hashtag Hero**: Uses many hashtags
- **Bot Interactor**: Interacts with bots frequently

## Title Determination

Titles are assigned based on the distribution of scores across domains:

1. **Crypto Connoisseur**: High crypto score, lower social and community scores
2. **Social Sage**: High social score, lower crypto and community scores
3. **Community Champion**: High community score, lower crypto and social scores
4. **Digital Explorer**: Balanced scores across all domains
5. **Web3 Wizard**: High scores across all domains

## Implementation Details

### 1. Data Collection

```javascript
// Collect data from various sources in parallel
const [userData, walletData, telegramData] = await Promise.all([
  getUserDetails(username),
  getWalletDetails(address),
  getTelegramData(userDid, authToken)
]);
```

### 2. Score Calculation

```javascript
// Calculate individual component scores
const twitterMetrics = calculateTwitterMetrics(userData);
const cryptoMetrics = calculateCryptoMetrics(walletData);
const telegramMetrics = calculateTelegramMetrics(telegramGroups, telegramMessages);

// Apply weights to calculate domain scores
const socialScore = applyWeights(twitterMetrics, socialWeights);
const cryptoScore = applyWeights(cryptoMetrics, cryptoWeights);
const nftScore = calculateNFTScore(walletData);
const telegramScore = applyWeights(telegramMetrics, telegramWeights);

// Calculate total score
const totalScore = socialScore + cryptoScore + nftScore + telegramScore;
```

### 3. Badge Assignment

```javascript
// Assign badges based on thresholds
const badges = {};

// Twitter badges
if (twitterMetrics.followers > thresholds.followers.influencer) {
  badges["Influence Investor"] = true;
}

// Crypto badges
if (cryptoMetrics.activeChains > thresholds.activeChains.explorer) {
  badges["Chain Explorer"] = true;
}

// Telegram badges
if (telegramMetrics.groupCount > thresholds.groupCount.guru) {
  badges["Group Guru"] = true;
}
```

### 4. Title Determination

```javascript
// Determine user's primary domain
const domains = [
  { name: 'crypto', score: cryptoScore + nftScore },
  { name: 'social', score: socialScore },
  { name: 'community', score: telegramScore }
];

// Sort domains by score
domains.sort((a, b) => b.score - a.score);

// Determine balance factor
const balanceFactor = calculateBalanceFactor(domains);

// Assign title based on domain distribution
let title = "Digital Explorer"; // Default title

if (totalScore > thresholds.totalScore.wizard && balanceFactor > 0.7) {
  title = "Web3 Wizard";
} else if (domains[0].score > domains[1].score * 2) {
  // Dominant domain
  switch (domains[0].name) {
    case 'crypto': title = "Crypto Connoisseur"; break;
    case 'social': title = "Social Sage"; break;
    case 'community': title = "Community Champion"; break;
  }
}
```

## Score Normalization

To ensure fair scoring across different sized accounts, the algorithm implements normalization techniques:

1. **Log-based scaling** for metrics with high variance (e.g., followers)
2. **Capped maximums** to prevent excessive influence from any single metric
3. **Ratio calculations** for engagement metrics to reward quality over quantity

## Result Format

The algorithm produces a comprehensive result object:

```javascript
{
  scores: {
    socialScore: 25,
    cryptoScore: 35,
    nftScore: 15,
    telegramScore: 20,
    totalScore: 95
  },
  badges: {
    "Chain Explorer": true,
    "Token Holder": true,
    "Social Connector": true
    // ... other badges
  },
  title: "Digital Explorer"
}
```

## Ongoing Development

The scoring algorithm is continuously refined based on:

1. **User feedback** and testing results
2. **New platform features** and metrics
3. **Evolving Web3 ecosystem** standards

Regular calibration ensures the algorithm remains relevant and accurately reflects users' digital presence and engagement across platforms. 