const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Get the Verida network from environment variables
const VERIDA_NETWORK = process.env.VERIDA_NETWORK || 'testnet';
console.log(`🌐 Using Verida network: ${VERIDA_NETWORK}`);

// Define the CORRECT API endpoint based on the example
const VERIDA_API_BASE_URL = process.env.VERIDA_API_BASE_URL || "https://api.verida.ai";
console.log(`🔌 Using Verida API base: ${VERIDA_API_BASE_URL}`);

// The API path prefix used in most endpoints
const API_PATH_PREFIX = "/api/rest/v1";
console.log(`🔌 API path prefix: ${API_PATH_PREFIX}`);

// The correct encoded schemas from the sandbox example
const GROUP_SCHEMA_ENCODED = 'aHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vc29jaWFsL2NoYXQvZ3JvdXAvdjAuMS4wL3NjaGVtYS5qc29u';
const MESSAGE_SCHEMA_ENCODED = 'aHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vc29jaWFsL2NoYXQvbWVzc2FnZS92MC4xLjAvc2NoZW1hLmpzb24%3D';

// Keywords to check for "Engage Bonus"
const ENGAGE_KEYWORDS = ['cluster', 'protocol', 'ai'];

// Initialize global token storage
global.userTokens = global.userTokens || {};

// Function to store auth token for a user
const storeAuthToken = (userId, token) => {
  if (!userId || !token) {
    throw new Error('User ID and token are required');
  }
  global.userTokens[userId] = token;
  return true;
};

// Function to get auth token for a user
const getAuthToken = (userId) => {
  if (!userId) {
    throw new Error('User ID is required to get auth token');
  }
  const token = global.userTokens[userId];
  if (!token) {
    throw new Error(`No auth token found for user ${userId}`);
  }
  return token;
};

// Helper function for base64 encoding
function btoa(str) {
  return Buffer.from(str).toString('base64');
}

// Helper function to test multiple Verida API endpoints
async function testVeridaEndpoints(authToken) {
  const endpoints = [
    '/api/profile',
    '/api/user/info',
    '/v1/user',
    '/user',
    '/profile'
  ];
  
  console.log('Testing Verida endpoints with token:', authToken.substring(0, 10) + '...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${VERIDA_API_BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`✅ Endpoint ${endpoint} succeeded:`, response.status);
      console.log('Response data keys:', Object.keys(response.data || {}));
      
      if (response.data?.did) {
        console.log('DID found in response:', response.data.did);
        return response.data.did;
      }
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} failed:`, error.message);
      console.log('Status:', error.response?.status);
    }
  }
  return null;
}

// Helper function to check for keywords in text content
function checkForKeywords(text, keywordMatches) {
  if (!text) return;
  
  const normalizedText = text.toLowerCase();
  
  ENGAGE_KEYWORDS.forEach(keyword => {
    let searchPos = 0;
    const lowerKeyword = keyword.toLowerCase();
    
    while (true) {
      const foundPos = normalizedText.indexOf(lowerKeyword, searchPos);
      if (foundPos === -1) break;
      
      const isWordStart = foundPos === 0 || 
        !normalizedText[foundPos-1].match(/[a-z0-9]/) || 
        normalizedText[foundPos-1] === '#';
        
      const isWordEnd = foundPos + lowerKeyword.length >= normalizedText.length || 
        !normalizedText[foundPos + lowerKeyword.length].match(/[a-z0-9]/);
      
      if (isWordStart && isWordEnd) {
        keywordMatches.keywords[keyword]++;
        keywordMatches.totalCount++;
        break;
      }
      
      searchPos = foundPos + 1;
    }
  });
}

// Function to get count from a datastore
async function getDatastoreCount(authToken, schemaUrl) {
  try {
    let count = 0;
    
    try {
      const apiUrl = `${VERIDA_API_BASE_URL}${API_PATH_PREFIX}/search/count`;
      const response = await axios({
        method: 'POST',
        url: apiUrl,
        data: {
          schema: schemaUrl,
          query: {
            sourceApplication: "https://telegram.com"
          }
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 10000
      });
      
      if (response.data && response.data.count !== undefined) {
        count = response.data.count;
        return count;
      }
    } catch (error) {
      // Try alternative endpoint
      const schemaUrlEncoded = btoa(schemaUrl);
      const apiUrl = `${VERIDA_API_BASE_URL}/api/rest/v1/ds/count/${schemaUrlEncoded}`;
      const response = await axios({
        method: 'POST',
        url: apiUrl,
        data: {
          query: {
            sourceApplication: "https://telegram.com"
          }
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 10000
      });
      
      if (response.data && response.data.count !== undefined) {
        count = response.data.count;
      }
    }
    
    return count;
  } catch (error) {
    return 0;
  }
}

const veridaService = {
  // Get user DID using the auth token
  getUserDID: async (authToken) => {
    try {
      if (!authToken) {
        throw new Error('Auth token is required');
      }

      console.log('Fetching user DID with auth token:', authToken.substring(0, 10) + '...');
      
      // Parse token if it's a JSON structure (Verida sometimes returns this format)
      let tokenObj = authToken;
      if (typeof authToken === 'string') {
        // If the token is a string, check if it's JSON or a Bearer token
        if (authToken.startsWith('{')) {
          try {
            tokenObj = JSON.parse(authToken);
          } catch (e) {
            // Not JSON, keep as-is
          }
        }
      }
      
      // Extract DID from token object if present
      if (tokenObj.token && tokenObj.token.did) {
        console.log('Extracted DID from token object:', tokenObj.token.did);
        return tokenObj.token.did;
      }

      // Format auth header correctly
      const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      // Try the new testing function for all endpoints
      const didFromTests = await testVeridaEndpoints(authToken);
      if (didFromTests) {
        return didFromTests;
      }
      
      // Try to get user profile info with the standard endpoint
      try {
        const profileResponse = await axios({
          method: 'GET',
          url: `${VERIDA_API_BASE_URL}/api/profile`,
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        if (profileResponse.data?.did) {
          console.log('Retrieved DID from profile:', profileResponse.data.did);
          return profileResponse.data.did;
        }
      } catch (profileError) {
        console.warn('Profile lookup failed:', profileError.message);
      }

      // Try a different API endpoint format
      try {
        const newEndpointResponse = await axios({
          method: 'GET',
          url: `${VERIDA_API_BASE_URL}/v1/user`,  // Try this endpoint instead
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        if (newEndpointResponse.data?.did) {
          console.log('Retrieved DID from v1/user endpoint:', newEndpointResponse.data.did);
          return newEndpointResponse.data.did;
        }
      } catch (newEndpointError) {
        console.warn('v1/user endpoint lookup failed:', newEndpointError.message);
      }

      // Try to get user info through alternative endpoint
      try {
        const userInfoResponse = await axios({
          method: 'GET',
          url: `${VERIDA_API_BASE_URL}/api/user/info`,
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        if (userInfoResponse.data?.did) {
          console.log('Retrieved DID from user info:', userInfoResponse.data.did);
          return userInfoResponse.data.did;
        }
      } catch (userInfoError) {
        console.warn('User info lookup failed:', userInfoError.message);
      }
      
      // As a last resort, use the default DID from .env
      if (process.env.DEFAULT_DID) {
        console.warn('Using DEFAULT_DID as fallback - not ideal for production');
        return process.env.DEFAULT_DID;
      }
      
      throw new Error('Could not determine user DID');
    } catch (error) {
      console.error('Error getting user DID:', error);
      throw error;
    }
  },

  // Get Telegram data (groups and messages) from Verida vault
  getTelegramData: async (did, authToken, options = {}) => {
    try {
      console.log(`\n🔍 FETCHING TELEGRAM DATA FROM VERIDA API 🔍`);
      console.log(`==============================================`);
      console.log(`🔑 User DID: ${did}`);
      
      // Set default pagination options
      const page = options.page || 1;
      const limit = options.limit || 100;
      const maxPages = options.maxPages || 3; // Limit to 3 pages by default to avoid excessive API calls
      
      // Store the auth token for use in subsequent requests
      storeAuthToken(did, authToken);
      
      // Fetch Telegram groups (no pagination needed for groups as there are typically few)
      const groups = await veridaService.getTelegramGroups(did, authToken);
      console.log(`✅ Retrieved ${groups.length} Telegram groups`);
      
      // Fetch Telegram messages with pagination
      let allMessages = [];
      let currentPage = page;
      let hasMoreMessages = true;
      
      // Get the total count of messages (for pagination info)
      const messageSchemaUrl = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json';
      const totalMessages = await getDatastoreCount(authToken, messageSchemaUrl);
      console.log(`📊 Total message count: ${totalMessages}`);
      
      // Fetch messages page by page up to the maximum
      while (hasMoreMessages && currentPage <= page + maxPages - 1) {
        console.log(`📑 Fetching message page ${currentPage}...`);
        const messages = await veridaService.getTelegramMessages(did, authToken, currentPage, limit);
        
        if (messages.length > 0) {
          allMessages = [...allMessages, ...messages];
          console.log(`✅ Added ${messages.length} messages from page ${currentPage}`);
          currentPage++;
        } else {
          hasMoreMessages = false;
          console.log(`📭 No more messages to fetch`);
        }
        
        // Break if we've retrieved all messages
        if (allMessages.length >= totalMessages) {
          console.log(`📊 Retrieved all available messages (${allMessages.length})`);
          hasMoreMessages = false;
        }
      }
      
      console.log(`✅ Total Telegram data retrieved: ${groups.length} groups, ${allMessages.length} messages`);
      
      return {
        groups,
        messages: allMessages,
        pagination: {
          totalMessages,
          currentPage: page,
          limit,
          totalPages: Math.ceil(totalMessages / limit)
        }
      };
    } catch (error) {
      console.error(`❌ Error in getTelegramData:`, error.message);
      return {
        groups: [],
        messages: [],
        pagination: {
          totalMessages: 0,
          currentPage: 1,
          limit: 100,
          totalPages: 0
        },
        error: error.message
      };
    }
  },

  // Get Telegram groups with detailed logging
  getTelegramGroups: async (did, authToken) => {
    try {
      console.log(`\n👥 FETCHING TELEGRAM GROUPS FROM VERIDA API 👥`);
      console.log(`==============================================`);
      
      // Use the correct schema URL and encode it in base64
      const schemaUrl = 'https://common.schemas.verida.io/social/chat/group/v0.1.0/schema.json';
      const schemaUrlEncoded = btoa(schemaUrl);
      
      console.log(`📋 Schema URL: ${schemaUrl}`);
      console.log(`📋 Encoded schema: ${schemaUrlEncoded}`);
      
      const apiUrl = `${VERIDA_API_BASE_URL}${API_PATH_PREFIX}/ds/query/${schemaUrlEncoded}`;
      console.log(`🌐 Making API request to: ${apiUrl}`);
      
      const requestData = {
        query: {
          sourceApplication: "https://telegram.com"
        },
        options: {
          sort: [{ _id: "desc" }]
        }
      };
      
      console.log(`📤 Request data: ${JSON.stringify(requestData, null, 2)}`);
      
      const response = await axios({
        method: 'POST',
        url: apiUrl,
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log(`✅ Retrieved ${response.data?.length || 0} Telegram groups`);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching Telegram groups:", error.message);
      return [];
    }
  },
  
  // Get Telegram messages with detailed logging
  getTelegramMessages: async (did, authToken, page = 1, limit = 100) => {
    try {
      console.log(`\n📝 FETCHING TELEGRAM MESSAGES FROM VERIDA API (Page ${page}, Limit ${limit}) 📝`);
      console.log(`==============================================`);
      
      // Use the correct schema URL and encode it in base64
      const schemaUrl = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json';
      const schemaUrlEncoded = btoa(schemaUrl);
      
      console.log(`📋 Schema URL: ${schemaUrl}`);
      console.log(`📋 Encoded schema: ${schemaUrlEncoded}`);
      
      // Calculate pagination offset
      const skip = (page - 1) * limit;
      
      const apiUrl = `${VERIDA_API_BASE_URL}${API_PATH_PREFIX}/ds/query/${schemaUrlEncoded}`;
      console.log(`🌐 Making API request to: ${apiUrl}`);
      
      const requestData = {
        query: {
          sourceApplication: "https://telegram.com"
        },
        options: {
          sort: [{ _id: "desc" }],
          limit: limit,
          skip: skip
        }
      };
      
      console.log(`📤 Request data: ${JSON.stringify(requestData, null, 2)}`);
      
      const response = await axios({
        method: 'POST',
        url: apiUrl,
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log(`✅ Retrieved ${response.data?.length || 0} Telegram messages`);
      return response.data || [];
    } catch (error) {
      console.error("❌ Error fetching Telegram messages:", error.message);
      return [];
    }
  },
  
  // Store auth token for a user
  storeAuthToken: storeAuthToken,
  
  // Get auth token for a user
  getAuthToken: getAuthToken,
  
  // Calculate Verida score based on Telegram data with detailed logging
  calculateVeridaScore: async (userId) => {
    console.log(`\n🧮 CALCULATING VERIDA SCORE FOR USER: ${userId} 🧮`);
    console.log(`===================================================`);
    
    try {
      console.log(`📊 Fetching Telegram data for scoring...`);
      
      // Fetch user's Telegram groups and messages
      const groups = await veridaService.getTelegramGroups(userId, getAuthToken(userId));
      const messages = await veridaService.getTelegramMessages(userId, getAuthToken(userId));
      
      console.log(`📊 Retrieved ${groups.length} groups and ${messages.length} messages`);
      
      // Define scoring metrics
      const metrics = {
        groupCount: groups.length,
        messageCount: messages.length,
        keywordMatches: {
          keywords: {
            cluster: 0,
            protocol: 0,
            ai: 0
          },
          totalCount: 0
        }
      };
      
      console.log(`📊 Initial metrics:`, JSON.stringify(metrics, null, 2));
      
      // Check for keywords in messages
      console.log(`🔍 Analyzing messages for keywords...`);
      
      if (messages.length > 0) {
        console.log(`📝 Message structure analysis:`);
        console.log(`📝 First message keys: ${Object.keys(messages[0]).join(', ')}`);
        
        // Try to find message content in various fields
        messages.forEach((message, index) => {
          // Log the first message in detail
          if (index === 0) {
            console.log(`📝 Sample message details:`, JSON.stringify(message, null, 2));
          }
          
          // Try multiple potential content fields
          let contentFields = [];
          
          // Common content field names
          if (message.content) contentFields.push({ field: 'content', value: message.content });
          if (message.text) contentFields.push({ field: 'text', value: message.text });
          if (message.body) contentFields.push({ field: 'body', value: message.body });
          if (message.message) contentFields.push({ field: 'message', value: message.message });
          if (message.messageText) contentFields.push({ field: 'messageText', value: message.messageText });
          
          // Look in data field if it exists
          if (message.data) {
            if (typeof message.data === 'string') {
              contentFields.push({ field: 'data', value: message.data });
            } else if (typeof message.data === 'object') {
              // Check common fields in data object
              if (message.data.content) contentFields.push({ field: 'data.content', value: message.data.content });
              if (message.data.text) contentFields.push({ field: 'data.text', value: message.data.text });
              if (message.data.body) contentFields.push({ field: 'data.body', value: message.data.body });
              if (message.data.message) contentFields.push({ field: 'data.message', value: message.data.message });
            }
          }
          
          // If we found content fields, check them for keywords
          if (contentFields.length > 0) {
            // Log first message's content fields
            if (index === 0) {
              console.log(`📝 Content fields found in message:`, contentFields.map(cf => cf.field).join(', '));
            }
            
            // Check each content field for keywords
            contentFields.forEach(cf => {
              if (cf.value && typeof cf.value === 'string') {
                // Only log the first message's content
                if (index === 0) {
                  console.log(`📝 Content from ${cf.field}: "${cf.value.substring(0, 100)}${cf.value.length > 100 ? '...' : ''}"`);
                }
                checkForKeywords(cf.value, metrics.keywordMatches);
              }
            });
          } else {
            // No standard content fields found, try to extract text from all string fields
            if (index === 0) {
              console.log(`📝 No standard content fields found, extracting from all string fields`);
            }
            
            let allText = [];
            Object.entries(message).forEach(([key, value]) => {
              if (typeof value === 'string') {
                allText.push(value);
              } else if (typeof value === 'object' && value !== null) {
                // Check nested objects for strings
                Object.values(value).forEach(nestedValue => {
                  if (typeof nestedValue === 'string') {
                    allText.push(nestedValue);
                  }
                });
              }
            });
            
            const combinedText = allText.join(' ');
            if (combinedText.trim()) {
              if (index === 0) {
                console.log(`📝 Combined text from all fields: "${combinedText.substring(0, 100)}${combinedText.length > 100 ? '...' : ''}"`);
              }
              checkForKeywords(combinedText, metrics.keywordMatches);
            }
          }
        });
      }
      
      console.log(`📊 Keyword analysis complete:`, JSON.stringify(metrics.keywordMatches, null, 2));
      
      // Define score weights
      const weights = {
        groupWeight: 5,      // Points per group
        messageWeight: 1,    // Points per message
        keywordWeight: 10    // Points per keyword match
      };
      
      console.log(`⚖️ Score weights:`, JSON.stringify(weights, null, 2));
      
      // Calculate component scores
      const groupScore = metrics.groupCount * weights.groupWeight;
      const messageScore = metrics.messageCount * weights.messageWeight;
      const keywordScore = metrics.keywordMatches.totalCount * weights.keywordWeight;
      
      // Calculate raw score (sum of all components)
      const rawScore = groupScore + messageScore + keywordScore;
      
      // No longer cap the score at 100
      const finalScore = rawScore;
      
      console.log(`\n📊 SCORE BREAKDOWN:`);
      console.log(`📊 Group Score: ${groupScore} (${metrics.groupCount} groups × ${weights.groupWeight} points)`);
      console.log(`📊 Message Score: ${messageScore} (${metrics.messageCount} messages × ${weights.messageWeight} points)`);
      console.log(`📊 Keyword Score: ${keywordScore} (${metrics.keywordMatches.totalCount} matches × ${weights.keywordWeight} points)`);
      console.log(`📊 Raw Score: ${rawScore}`);
      console.log(`📊 Final Score (uncapped): ${finalScore}`);
      
      // Prepare the result object
      const result = {
        success: true,
        score: finalScore,
        details: {
          groups: {
            count: metrics.groupCount,
            score: groupScore
          },
          messages: {
            count: metrics.messageCount,
            score: messageScore
          },
          keywords: {
            matches: metrics.keywordMatches,
            score: keywordScore
          },
          rawScore: rawScore
        }
      };
      
      console.log(`✅ Score calculation complete!`);
      console.log(`===================================================\n`);
      
      return result;
    } catch (error) {
      console.error(`\n❌ ERROR CALCULATING VERIDA SCORE:`);
      console.error(error);
      
      if (error.response) {
        console.error(`❌ Response status: ${error.response.status}`);
        console.error(`❌ Response data:`, error.response.data);
      }
      
      console.error(`===================================================\n`);
      
      return {
        success: false,
        error: `Failed to calculate Verida score: ${error.message}`,
        score: 0,
        details: {}
      };
    }
  },

  // Generate auth URL for Verida connection
  generateAuthUrl: async () => {
    try {
      console.log(`🔍 Generating Verida auth URL...`);
      // Define scopes needed for Telegram data
      const scopesList = [
        'api:ds-query',
        'api:search-universal',
        'ds:social-email',
        'api:connections-profiles',
        'api:connections-status',
        'api:db-query',
        'api:ds-get-by-id',
        'api:db-get-by-id',
        'api:ds-update',
        'api:search-ds',
        'api:search-chat-threads',
        'ds:r:social-chat-group',
        'ds:r:social-chat-message'
      ];
      console.log(`✅ Defined ${scopesList.length} scopes`);
      
      // IMPORTANT: Set redirectUrl to our backend callback endpoint, not the frontend directly
      const backendUrl = process.env.API_BASE_URL || 'http://localhost:5000';
      const redirectUrl = `${backendUrl}/api/verida/auth/callback`;
      // Using the same appDID as in the example project
      const appDID = 'did:vda:mainnet:0x87AE6A302aBf187298FC1Fa02A48cFD9EAd2818D';
      
      console.log(`🔄 Redirect URL: ${redirectUrl}`);
      console.log(`🆔 App DID: ${appDID}`);
      
      // Construct URL with multiple scope parameters - HARDCODED format
      let authUrl = 'https://app.verida.ai/auth?';
      
      // Add each scope individually
      scopesList.forEach(scope => {
        authUrl += `scopes=${encodeURIComponent(scope)}&`;
      });
      
      // Add redirect URL and appDID
      authUrl += `redirectUrl=${encodeURIComponent(redirectUrl)}&appDID=${encodeURIComponent(appDID)}`;
      
      console.log(`✅ Generated auth URL: ${authUrl.substring(0, 60)}...`);
      console.log(`✅ Full URL length: ${authUrl.length} characters`);
      
      return authUrl;
    } catch (error) {
      console.error(`❌ Error generating auth URL: ${error.message}`);
      throw error;
    }
  }
};

// Helper function to calculate message frequency (more frequent = higher score)
function calculateMessageFrequency(messages) {
  if (!messages.length) return 0;

  // Sort messages by date
  const sortedMessages = messages.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate average time between messages
  let totalTimeDiff = 0;
  let count = 0;

  for (let i = 1; i < sortedMessages.length; i++) {
    const timeDiff = new Date(sortedMessages[i].date) - new Date(sortedMessages[i-1].date);
    totalTimeDiff += timeDiff;
    count++;
  }

  if (count === 0) return 0;

  const avgTimeDiff = totalTimeDiff / count;
  
  // Convert to a score (0-1) where lower time difference = higher score
  // 24 hours as max reasonable time between messages
  const maxTimeDiff = 24 * 60 * 60 * 1000; 
  return Math.max(0, 1 - (avgTimeDiff / maxTimeDiff));
}

// Export both service and helper function for testing
veridaService.calculateMessageFrequency = calculateMessageFrequency;

module.exports = veridaService;