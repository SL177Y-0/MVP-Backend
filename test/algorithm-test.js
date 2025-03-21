/**
 * Score Algorithm Test
 * This script simulates how the scoring algorithm processes user data and calculates scores.
 */

// Sample weights from the algorithm (same as in SCORE_ALGORITHM.md)
const weights = {
    // Twitter/Social weights
    followers: 0.001, 
    retweets: 0.005, 
    quotes: 0.005, 
    replies: 0.002, 
    engagement: 0.0001, 
    verification: 5, 
    tweetFreq: 0.001,
    subscriptions: 2, 
    accountAge: 0.1, 
    media: 0.01, 
    pinned: 5, 
    friends: 0.001, 
    listed: 0.01, 
    superFollow: 5,
    
    // Blockchain/Crypto weights
    activeChains: 5, 
    nativeBalance: 10, 
    tokenHoldings: 2, 
    nftHoldings: 5, 
    defiPositions: 5, 
    web3Domains: 5,
    transactionCount: 0.01, 
    uniqueTokenInteractions: 1,
    
    // Telegram weights
    groupCount: 2, 
    messageFreq: 0.1, 
    pinnedMessages: 5,
    mediaMessages: 2, 
    hashtags: 1, 
    polls: 2, 
    leadership: 5, 
    botInteractions: 1, 
    stickerMessages: 0.5,
    gifMessages: 0.5, 
    mentionCount: 1
};

// Badge thresholds
const badgeThresholds = {
    // Twitter thresholds
    followers: { influencer: 1000 },
    statuses: { trader: 1000 },
    engagement: { economist: 0.01 },
    media: { mogul: 50 },
    verified: { visionary: true },
    
    // Blockchain thresholds
    activeChains: { explorer: 2 },
    tokenTypes: { holder: 5 },
    nftCount: { networker: 3 },
    defiPositions: { drifter: 1 },
    transactionCount: { titan: 100 },
    
    // Telegram thresholds
    groupCount: { guru: 3 },
    messageCount: { maestro: 50 },
    adminRoles: { leader: 1 },
    hashtagUse: { hero: 10 },
    botInteractions: { interactor: 5 }
};

// Title requirements
const titleRequirements = {
    wizard: {
        totalScore: 200,
        balanceFactor: 0.7
    },
    dominanceFactor: 2 // How much stronger the primary domain must be
};

// Sample user data
const testCase1 = {
    twitter: {
        result: {
            legacy: {
                created_at: "2019-05-15T14:22:15.000Z",
                followers_count: 1500,
                friends_count: 500,
                statuses_count: 1200,
                favourites_count: 3000,
                media_count: 60,
                verified: false,
                listed_count: 10
            }
        }
    },
    blockchain: {
        "Native Balance Result": 0.5,
        "Token Balances Result": [
            { token_address: "0x1", name: "Token1", balance: "100000000000000000000" },
            { token_address: "0x2", name: "Token2", balance: "200000000000000000000" },
            { token_address: "0x3", name: "Token3", balance: "300000000000000000000" }
        ],
        "Active Chains Result": { activeChains: ["ethereum", "polygon", "bsc"] },
        "DeFi Positions Summary Result": [
            { protocol: "Uniswap", balance: "1000000000000000000" },
            { protocol: "Aave", balance: "2000000000000000000" }
        ],
        "Wallet NFTs Result": [
            { token_address: "0xnft1", token_id: "1" },
            { token_address: "0xnft2", token_id: "2" },
            { token_address: "0xnft3", token_id: "3" },
            { token_address: "0xnft4", token_id: "4" }
        ],
        "Transaction Count": 150,
        "Unique Token Interactions": 8
    },
    telegram: {
        groups: { items: [
            { id: "group1", name: "Group 1", members: 100, isAdmin: true },
            { id: "group2", name: "Group 2", members: 200 },
            { id: "group3", name: "Group 3", members: 300 },
            { id: "group4", name: "Group 4", members: 400 }
        ]},
        messages: { items: Array(70).fill().map((_, i) => ({
            id: `msg${i}`,
            groupId: `group${1 + (i % 4)}`,
            hasMedia: i % 5 === 0,
            hasHashtag: i % 6 === 0,
            isPinned: i % 20 === 0,
            hasGif: i % 10 === 0,
            hasSticker: i % 8 === 0,
            hasMention: i % 7 === 0,
            hasPoll: i % 25 === 0,
            isBotInteraction: i % 15 === 0
        }))}
    }
};

// Test case 2: Crypto-focused user
const testCase2 = {
    twitter: {
        result: {
            legacy: {
                created_at: "2020-01-01T00:00:00.000Z",
                followers_count: 300,
                friends_count: 200,
                statuses_count: 150,
                favourites_count: 400,
                media_count: 20,
                verified: false,
                listed_count: 2
            }
        }
    },
    blockchain: {
        "Native Balance Result": 5.0,
        "Token Balances Result": Array(12).fill().map((_, i) => ({ 
            token_address: `0x${i}`, 
            name: `Token${i}`, 
            balance: `${(i+1) * 100000000000000000000}` 
        })),
        "Active Chains Result": { activeChains: ["ethereum", "polygon", "bsc", "arbitrum", "optimism"] },
        "DeFi Positions Summary Result": Array(8).fill().map((_, i) => ({ 
            protocol: `Protocol${i}`, 
            balance: `${(i+1) * 1000000000000000000}` 
        })),
        "Wallet NFTs Result": Array(15).fill().map((_, i) => ({ 
            token_address: `0xnft${i}`, 
            token_id: `${i}` 
        })),
        "Transaction Count": 500,
        "Unique Token Interactions": 25
    },
    telegram: {
        groups: { items: [
            { id: "group1", name: "Group 1", members: 100 }
        ]},
        messages: { items: Array(10).fill().map((_, i) => ({
            id: `msg${i}`,
            groupId: "group1",
            hasMedia: i % 5 === 0,
            hasHashtag: i % 6 === 0,
            isPinned: false,
            hasGif: i % 10 === 0,
            hasSticker: i % 8 === 0,
            hasMention: i % 7 === 0,
            hasPoll: false,
            isBotInteraction: i % 15 === 0
        }))}
    }
};

// Test case 3: Social-focused user
const testCase3 = {
    twitter: {
        result: {
            legacy: {
                created_at: "2015-05-15T14:22:15.000Z",
                followers_count: 12000,
                friends_count: 1500,
                statuses_count: 8000,
                favourites_count: 15000,
                media_count: 2000,
                verified: true,
                listed_count: 50
            }
        }
    },
    blockchain: {
        "Native Balance Result": 0.1,
        "Token Balances Result": [
            { token_address: "0x1", name: "Token1", balance: "100000000000000000000" }
        ],
        "Active Chains Result": { activeChains: ["ethereum"] },
        "DeFi Positions Summary Result": [],
        "Wallet NFTs Result": [
            { token_address: "0xnft1", token_id: "1" }
        ],
        "Transaction Count": 20,
        "Unique Token Interactions": 3
    },
    telegram: {
        groups: { items: [
            { id: "group1", name: "Group 1", members: 100 },
            { id: "group2", name: "Group 2", members: 200 }
        ]},
        messages: { items: Array(30).fill().map((_, i) => ({
            id: `msg${i}`,
            groupId: `group${1 + (i % 2)}`,
            hasMedia: i % 5 === 0,
            hasHashtag: i % 6 === 0,
            isPinned: i % 20 === 0,
            hasGif: i % 10 === 0,
            hasSticker: i % 8 === 0,
            hasMention: i % 7 === 0,
            hasPoll: i % 25 === 0,
            isBotInteraction: i % 15 === 0
        }))}
    }
};

// Function to calculate Twitter metrics
function calculateTwitterMetrics(userData) {
    const legacy = userData?.result?.legacy || {};
    
    const createdAt = legacy.created_at ? new Date(legacy.created_at) : new Date();
    const now = new Date();
    const ageMonths = (now - createdAt) / (1000 * 60 * 60 * 24 * 30);
    
    const totalEngagement = (legacy.favourites_count || 0) + 
                           (legacy.statuses_count || 0) * 3;
                           
    const engagementRatio = legacy.followers_count ? 
                            totalEngagement / legacy.followers_count : 0;
    
    return {
        followers: legacy.followers_count || 0,
        friends: legacy.friends_count || 0,
        statuses: legacy.statuses_count || 0,
        favourites: legacy.favourites_count || 0,
        media: legacy.media_count || 0,
        verified: legacy.verified || false,
        listed: legacy.listed_count || 0,
        accountAge: ageMonths,
        totalEngagement,
        engagementRatio
    };
}

// Function to calculate blockchain metrics
function calculateBlockchainMetrics(blockchainData) {
    const activeChains = blockchainData["Active Chains Result"]?.activeChains?.length || 0;
    const nativeBalance = blockchainData["Native Balance Result"] || 0;
    const tokenBalances = blockchainData["Token Balances Result"] || [];
    const nfts = blockchainData["Wallet NFTs Result"] || [];
    const defiPositions = blockchainData["DeFi Positions Summary Result"] || [];
    const txCount = blockchainData["Transaction Count"] || 0;
    const tokenInteractions = blockchainData["Unique Token Interactions"] || 0;
    
    return {
        activeChains,
        nativeBalance,
        tokenHoldings: tokenBalances.length,
        nftHoldings: nfts.length,
        defiPositions: defiPositions.length,
        transactionCount: txCount,
        tokenInteractions
    };
}

// Function to calculate Telegram metrics
function calculateTelegramMetrics(groups, messages) {
    const groupItems = groups?.items || [];
    const messageItems = messages?.items || [];
    
    const adminRoles = groupItems.filter(g => g.isAdmin).length;
    const mediaMessages = messageItems.filter(m => m.hasMedia).length;
    const pinnedMessages = messageItems.filter(m => m.isPinned).length;
    const hashtagCount = messageItems.filter(m => m.hasHashtag).length;
    const gifMessages = messageItems.filter(m => m.hasGif).length;
    const stickerMessages = messageItems.filter(m => m.hasSticker).length;
    const mentionCount = messageItems.filter(m => m.hasMention).length;
    const pollCount = messageItems.filter(m => m.hasPoll).length;
    const botInteractions = messageItems.filter(m => m.isBotInteraction).length;
    
    return {
        groupCount: groupItems.length,
        messageCount: messageItems.length,
        messageFreq: messageItems.length / Math.max(groupItems.length, 1),
        adminRoles,
        mediaMessages,
        pinnedMessages,
        hashtagCount,
        gifMessages,
        stickerMessages,
        mentionCount,
        pollCount,
        botInteractions
    };
}

// Apply weights to metrics
function applyWeights(metrics, weightSet) {
    let score = 0;
    
    // For each metric, apply its corresponding weight if available
    for (const [key, value] of Object.entries(metrics)) {
        if (weightSet[key]) {
            score += value * weightSet[key];
        }
    }
    
    return Math.round(score);
}

// Determine badges based on metrics
function determineBadges(twitterMetrics, blockchainMetrics, telegramMetrics) {
    const badges = {};
    
    // Twitter badges
    if (twitterMetrics.followers > badgeThresholds.followers.influencer) {
        badges["Influence Investor"] = true;
    }
    if (twitterMetrics.statuses > badgeThresholds.statuses.trader) {
        badges["Tweet Trader"] = true;
    }
    if (twitterMetrics.engagementRatio > badgeThresholds.engagement.economist) {
        badges["Engagement Economist"] = true;
    }
    if (twitterMetrics.media > badgeThresholds.media.mogul) {
        badges["Media Mogul"] = true;
    }
    if (twitterMetrics.verified === badgeThresholds.verified.visionary) {
        badges["Verified Visionary"] = true;
    }
    
    // Blockchain badges
    if (blockchainMetrics.activeChains > badgeThresholds.activeChains.explorer) {
        badges["Chain Explorer"] = true;
    }
    if (blockchainMetrics.tokenHoldings > badgeThresholds.tokenTypes.holder) {
        badges["Token Holder"] = true;
    }
    if (blockchainMetrics.nftHoldings > badgeThresholds.nftCount.networker) {
        badges["NFT Networker"] = true;
    }
    if (blockchainMetrics.defiPositions > badgeThresholds.defiPositions.drifter) {
        badges["DeFi Drifter"] = true;
    }
    if (blockchainMetrics.transactionCount > badgeThresholds.transactionCount.titan) {
        badges["Transaction Titan"] = true;
    }
    
    // Telegram badges
    if (telegramMetrics.groupCount > badgeThresholds.groupCount.guru) {
        badges["Group Guru"] = true;
    }
    if (telegramMetrics.messageCount > badgeThresholds.messageCount.maestro) {
        badges["Message Maestro"] = true;
    }
    if (telegramMetrics.adminRoles > badgeThresholds.adminRoles.leader) {
        badges["Community Leader"] = true;
    }
    if (telegramMetrics.hashtagCount > badgeThresholds.hashtagUse.hero) {
        badges["Hashtag Hero"] = true;
    }
    if (telegramMetrics.botInteractions > badgeThresholds.botInteractions.interactor) {
        badges["Bot Interactor"] = true;
    }
    
    return badges;
}

// Calculate balance factor for domain distribution
function calculateBalanceFactor(domainScores) {
    if (domainScores.length < 2) return 0;
    
    // Sort domains by score (descending)
    const sortedDomains = [...domainScores].sort((a, b) => b.score - a.score);
    
    // Calculate total score
    const totalScore = sortedDomains.reduce((sum, domain) => sum + domain.score, 0);
    
    // If total score is 0, return 0
    if (totalScore === 0) return 0;
    
    // Calculate distribution (how evenly scores are distributed)
    const expectedShare = 1 / sortedDomains.length;
    let deviation = 0;
    
    for (const domain of sortedDomains) {
        const share = domain.score / totalScore;
        deviation += Math.abs(share - expectedShare);
    }
    
    // Convert deviation to balance factor (1 - normalized deviation)
    const normalizedDeviation = deviation / 2; // Normalize to 0-1 range
    const balanceFactor = 1 - normalizedDeviation;
    
    return balanceFactor;
}

// Determine user title based on scores
function determineTitle(socialScore, cryptoScore, nftScore, telegramScore, badges) {
    const totalScore = socialScore + cryptoScore + nftScore + telegramScore;
    
    // Define domains
    const domains = [
        { name: 'crypto', score: cryptoScore + nftScore },
        { name: 'social', score: socialScore },
        { name: 'community', score: telegramScore }
    ];
    
    // Sort domains by score (descending)
    domains.sort((a, b) => b.score - a.score);
    
    // Calculate balance factor
    const balanceFactor = calculateBalanceFactor(domains);
    
    let title = "Digital Explorer"; // Default title
    
    if (totalScore > titleRequirements.wizard.totalScore && 
        balanceFactor > titleRequirements.wizard.balanceFactor) {
        title = "Web3 Wizard";
    } else if (domains[0].score > domains[1].score * titleRequirements.dominanceFactor) {
        // Dominant domain
        switch (domains[0].name) {
            case 'crypto': title = "Crypto Connoisseur"; break;
            case 'social': title = "Social Sage"; break;
            case 'community': title = "Community Champion"; break;
        }
    }
    
    return {
        title,
        totalScore,
        balanceFactor,
        dominantDomain: domains[0].name,
        domainDistribution: domains.map(d => ({ 
            name: d.name, 
            score: d.score,
            percentage: totalScore > 0 ? Math.round((d.score / totalScore) * 100) : 0
        }))
    };
}

// Main function to evaluate user
function evaluateUser(userData, blockchainData, telegramGroups, telegramMessages) {
    // Calculate metrics
    const twitterMetrics = calculateTwitterMetrics(userData);
    const blockchainMetrics = calculateBlockchainMetrics(blockchainData);
    const telegramMetrics = calculateTelegramMetrics(telegramGroups, telegramMessages);
    
    // Apply weights to calculate domain scores
    const socialWeights = {
        followers: weights.followers,
        friends: weights.friends, 
        statuses: weights.tweetFreq, 
        media: weights.media,
        verified: weights.verification ? 1 : 0,
        listed: weights.listed,
        accountAge: weights.accountAge,
        engagementRatio: weights.engagement * 10000 // Scale up for readability
    };
    
    const cryptoWeights = {
        activeChains: weights.activeChains,
        nativeBalance: weights.nativeBalance,
        tokenHoldings: weights.tokenHoldings,
        defiPositions: weights.defiPositions,
        transactionCount: weights.transactionCount,
        tokenInteractions: weights.uniqueTokenInteractions
    };
    
    const nftWeights = {
        nftHoldings: weights.nftHoldings
    };
    
    const telegramWeights = {
        groupCount: weights.groupCount,
        messageFreq: weights.messageFreq,
        pinnedMessages: weights.pinnedMessages,
        mediaMessages: weights.mediaMessages,
        hashtagCount: weights.hashtags,
        pollCount: weights.polls,
        adminRoles: weights.leadership,
        botInteractions: weights.botInteractions,
        stickerMessages: weights.stickerMessages,
        gifMessages: weights.gifMessages,
        mentionCount: weights.mentionCount
    };
    
    const socialScore = applyWeights(twitterMetrics, socialWeights);
    const cryptoScore = applyWeights(blockchainMetrics, cryptoWeights);
    const nftScore = applyWeights(blockchainMetrics, nftWeights);
    const telegramScore = applyWeights(telegramMetrics, telegramWeights);
    
    // Determine badges
    const badges = determineBadges(twitterMetrics, blockchainMetrics, telegramMetrics);
    
    // Determine title
    const titleInfo = determineTitle(socialScore, cryptoScore, nftScore, telegramScore, badges);
    
    return {
        metrics: {
            twitter: twitterMetrics,
            blockchain: blockchainMetrics,
            telegram: telegramMetrics
        },
        scores: {
            socialScore,
            cryptoScore,
            nftScore,
            telegramScore,
            totalScore: titleInfo.totalScore
        },
        badges,
        title: titleInfo.title,
        titleDetails: titleInfo
    };
}

// Run test cases
function runTest(testCase, name) {
    console.log(`\n======== Testing ${name} ========`);
    const result = evaluateUser(
        testCase.twitter, 
        testCase.blockchain, 
        testCase.telegram.groups, 
        testCase.telegram.messages
    );
    
    console.log("SCORE RESULTS:");
    console.log(`Social Score: ${result.scores.socialScore}`);
    console.log(`Crypto Score: ${result.scores.cryptoScore}`);
    console.log(`NFT Score: ${result.scores.nftScore}`);
    console.log(`Telegram Score: ${result.scores.telegramScore}`);
    console.log(`Total Score: ${result.scores.totalScore}`);
    
    console.log("\nBADGES:");
    const badgeList = Object.keys(result.badges);
    console.log(badgeList.length > 0 ? badgeList.join(", ") : "No badges earned");
    
    console.log("\nTITLE:");
    console.log(`Title: ${result.title}`);
    console.log(`Balance Factor: ${result.titleDetails.balanceFactor.toFixed(2)}`);
    console.log(`Dominant Domain: ${result.titleDetails.dominantDomain}`);
    
    console.log("\nDOMAIN DISTRIBUTION:");
    result.titleDetails.domainDistribution.forEach(domain => {
        console.log(`${domain.name}: ${domain.score} (${domain.percentage}%)`);
    });
    
    return result;
}

// Run all test cases
console.log("ALGORITHM TEST RESULTS");
console.log("======================");

const testCase1Result = runTest(testCase1, "BALANCED USER");
const testCase2Result = runTest(testCase2, "CRYPTO-FOCUSED USER");
const testCase3Result = runTest(testCase3, "SOCIAL-FOCUSED USER");

console.log("\n======== SUMMARY ========");
console.log(`Test Case 1 (Balanced): Title = ${testCase1Result.title}, Score = ${testCase1Result.scores.totalScore}`);
console.log(`Test Case 2 (Crypto): Title = ${testCase2Result.title}, Score = ${testCase2Result.scores.totalScore}`);
console.log(`Test Case 3 (Social): Title = ${testCase3Result.title}, Score = ${testCase3Result.scores.totalScore}`); 