# API Reference

## Authentication

All protected endpoints require the `privyId` for authentication.

### Authentication Flow

1. Frontend integrates with Privy authentication
2. On successful authentication, the frontend receives a `privyId`
3. Include this `privyId` in all API requests
4. The backend validates the `privyId` against the database

## Endpoints

### Score Calculation

#### Calculate User Score

Calculates and updates a user's score based on their connected accounts.

**Endpoint:** `POST /api/scores/get-score`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "privyId": "user-privy-id",                // Required: User's Privy identifier
  "twitterUsername": "username",             // Optional: Twitter username
  "walletAddress": "0x123...",               // Optional: Primary wallet address
  "walletAddresses": ["0x123...", "0x456..."], // Optional: Array of wallet addresses
  "email": "user@example.com",               // Optional: User's email
  "userDid": "did:vda:0x...",                // Optional: Verida DID
  "authToken": "verida-auth-token",          // Optional: Verida authentication token
  "veridaUserId": "verida-user-id",          // Optional: Verida user ID
  "veridaConnected": true,                   // Optional: Indicates if Verida is connected
  "twitterConnected": true,                  // Optional: Indicates if Twitter is connected
  "walletConnected": true                    // Optional: Indicates if wallet is connected
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "privyId": "user-privy-id",
  "title": "Digital Explorer",
  "badges": ["Chain Explorer", "Token Holder", "Social Connector"],
  "scores": {
    "socialScore": 25,
    "cryptoScore": 35,
    "nftScore": 15,
    "telegramScore": 20,
    "totalScore": 95
  },
  "walletCount": 2
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Provide a Privy ID"
}
```

**Error Response (500 Server Error):**
```json
{
  "success": false,
  "error": "Server Error",
  "message": "Error details"
}
```

#### Get Total Score

Retrieves a user's total score and badges.

**Endpoint:** `GET /api/scores/total-score/:privyId`

**Parameters:**
- `privyId` (path parameter): User's Privy identifier

**Response (200 OK):**
```json
{
  "success": true,
  "totalScore": 95,
  "twitterScore": 25,
  "telegramScore": 20,
  "walletScores": [
    {
      "walletAddress": "0x123...",
      "score": 50
    }
  ],
  "badges": ["Chain Explorer", "Token Holder", "Social Connector"]
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Privy ID is required"
}
```

**Error Response (500 Server Error):**
```json
{
  "success": false,
  "error": "Server Error"
}
```

### Twitter Integration

#### Get Twitter User Details

Retrieves user details from Twitter.

**Endpoint:** `GET /api/twitter/user/:username`

**Parameters:**
- `username` (path parameter): Twitter username

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "result": {
      "legacy": {
        "created_at": "2019-05-15T14:22:15.000Z",
        "followers_count": 1234,
        "friends_count": 567,
        "statuses_count": 890,
        "favourites_count": 123,
        "media_count": 45,
        "verified": false
      }
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Username is required"
}
```

### Blockchain Integration

#### Get Wallet Details

Retrieves details about a blockchain wallet.

**Endpoint:** `GET /api/blockchain/wallet/:address`

**Parameters:**
- `address` (path parameter): Wallet address

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "Native Balance Result": 1.234,
    "Token Balances Result": [
      {
        "token_address": "0xabc...",
        "name": "Example Token",
        "symbol": "ETK",
        "balance": "1000000000000000000",
        "decimals": 18
      }
    ],
    "Active Chains Result": {
      "activeChains": ["ethereum", "polygon"]
    },
    "Transaction Count": 123,
    "Unique Token Interactions": 45,
    "Wallet NFTs Result": [
      {
        "token_address": "0xdef...",
        "token_id": "1234",
        "name": "Example NFT",
        "symbol": "ENFT"
      }
    ]
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Wallet address is required"
}
```

### Telegram/Verida Integration

#### Get Telegram Data

Retrieves Telegram data via Verida.

**Endpoint:** `POST /api/verida/telegram`

**Request Body:**
```json
{
  "userDid": "did:vda:0x...",
  "authToken": "verida-auth-token",
  "page": 1,                     // Optional: Page number (default: 1)
  "limit": 100                   // Optional: Items per page (default: 100)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "group-id",
        "name": "Group Name",
        "description": "Group Description",
        "memberCount": 123
      }
    ],
    "messages": [
      {
        "id": "message-id",
        "groupId": "group-id",
        "content": "Message content",
        "timestamp": "2023-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "totalMessages": 521,
      "currentPage": 1,
      "limit": 100,
      "totalPages": 6
    }
  }
}
```

## Data Models

### User Model

```javascript
{
  privyId: String,                // Unique identifier from Privy
  email: String,                  // User's email address
  twitterUsername: String,        // Twitter username
  totalScore: Number,             // Total calculated score
  walletAddress: String,          // Primary wallet address
  walletConnected: Boolean,       // Whether wallet is connected
  twitterConnected: Boolean,      // Whether Twitter is connected
  veridaConnected: Boolean,       // Whether Verida/Telegram is connected
  veridaUserId: String,           // Verida user ID
  scoreDetails: {                 // Detailed score breakdown
    twitterScore: Number,
    walletScore: Number,
    veridaScore: Number,
    twitterDetails: Object,
    walletDetails: Object,
    veridaDetails: Object
  },
  lastScoreUpdate: Date           // When the score was last updated
}
```

### Score Model

```javascript
{
  privyId: String,                // Unique identifier from Privy
  username: String,               // Twitter username
  email: String,                  // User's email address
  twitterScore: Number,           // Twitter score component
  telegramScore: Number,          // Telegram score component
  totalScore: Number,             // Total calculated score
  badges: [String],               // Array of badge identifiers
  wallets: [{                     // Array of wallet records
    walletAddress: String,        // Wallet address
    score: Number                 // Score for this wallet
  }]
}
```

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common error codes:
- `400` - Bad Request (missing parameters, validation errors)
- `401` - Unauthorized (authentication issues)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Server Error (internal issues)

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Score calculation: 10 requests per minute per user
- Twitter API: 5 requests per minute per user
- Blockchain API: 20 requests per minute per user

When rate limit is exceeded, you'll receive:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later.",
  "retryAfter": 30  // Seconds until you can retry
}
```

## Integration Examples

### Complete User Onboarding Flow

```javascript
// 1. User authenticates with Privy
const authResult = await privyClient.authenticate();
const privyId = authResult.userId;

// 2. Store user info
await axios.post(`${API_URL}/api/users`, {
  privyId,
  email: userEmail
});

// 3. Connect Twitter
await axios.post(`${API_URL}/api/scores/get-score`, {
  privyId,
  twitterUsername: twitterUsername,
  twitterConnected: true
});

// 4. Connect wallet
await axios.post(`${API_URL}/api/scores/get-score`, {
  privyId,
  walletAddresses: [primaryWalletAddress, ...otherWallets],
  walletConnected: true
});

// 5. Connect Verida/Telegram
await axios.post(`${API_URL}/api/scores/get-score`, {
  privyId,
  userDid,
  authToken,
  veridaConnected: true
});

// 6. Get final score
const finalScore = await axios.get(`${API_URL}/api/scores/total-score/${privyId}`);
```

### Dashboard Data Retrieval

```javascript
async function getDashboardData(privyId) {
  try {
    // Get user score data
    const scoreData = await axios.get(`${API_URL}/api/scores/total-score/${privyId}`);
    
    return {
      totalScore: scoreData.data.totalScore,
      badges: scoreData.data.badges,
      twitterScore: scoreData.data.twitterScore,
      telegramScore: scoreData.data.telegramScore,
      walletScores: scoreData.data.walletScores
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}
```

## Security Best Practices

1. Never expose authentication tokens in client-side code
2. Implement proper error handling for all API calls
3. Validate user input before sending to the API
4. Use HTTPS for all API communication
5. Implement proper user session management
6. Follow the principle of least privilege when requesting data 