# Backend Architecture

## Overview

The backend system is built using a modular architecture with clear separation of concerns. It follows modern Node.js/Express best practices and implements several design patterns to ensure maintainability and scalability.

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Routes   │────▶│Controllers │────▶│  Services  │
└────────────┘     └────────────┘     └────────────┘
                         │                   │
                         ▼                   ▼
                   ┌────────────┐     ┌────────────┐
                   │  Models    │◀───▶│  External  │
                   │ (MongoDB)  │     │    APIs    │
                   └────────────┘     └────────────┘
```

## Core Components

### 1. Routes

Routes handle HTTP requests and direct them to the appropriate controllers. They implement basic middleware such as validation and rate limiting.

Key files:
- `routes/scoreRoutes.js` - Score calculation and retrieval
- `routes/api.js` - General API endpoints
- `routes/userRoutes.js` - User management

### 2. Controllers

Controllers are responsible for processing requests, calling appropriate services, and formatting responses. They follow a class-based structure for consistency.

Key files:
- `controllers/NewScoreController.js` - Score calculation and management
- `controllers/BlockchainController.js` - Blockchain data processing
- `controllers/twitterController.js` - Twitter data processing

### 3. Services

Services contain the business logic and interact with external APIs and databases.

Key files:
- `Services/veridaService.js` - Verida/Telegram integration
- `Services/moralisService.js` - Blockchain data fetching
- `Services/tokenService.js` - Token management

### 4. Models

Models define the data structure and handle database operations.

Key files:
- `models/User.js` - User data model
- `models/Score.js` - Score data model
- `models/Wallet.js` - Wallet data model

### 5. Utils

Utility functions and middleware.

Key files:
- `utils/baseController.js` - Base controller class
- `utils/errorHandler.js` - Centralized error handling
- `utils/validation.js` - Input validation

## Data Flow

### Score Calculation Flow

1. User sends request to `POST /api/scores/get-score`
2. Route applies validation middleware
3. ScoreController extracts parameters and validates privyId
4. Controller fetches data in parallel from:
   - Twitter API (via twitterController)
   - Blockchain API (via BlockchainController)
   - Verida API (via veridaService)
5. Score algorithm (evaluateUser) processes the data
6. Results are saved to database (Score and User models)
7. Formatted response is sent back to user

## Design Patterns

### 1. Dependency Injection

Services are injected into controllers, making the code more testable and modular.

### 2. Repository Pattern

Database operations are encapsulated in model methods.

### 3. Middleware Pattern

Express middleware is used for cross-cutting concerns like validation and error handling.

### 4. Controller-Service Pattern

Business logic is separated from request handling.

## Performance Optimizations

### 1. Parallel Data Fetching

The system fetches data from multiple sources in parallel using Promise.all.

```javascript
const [userData, walletData, telegramData] = await Promise.all([
  getUserDetails(username),
  getWalletDetails(address),
  getTelegramData(userDid, authToken)
]);
```

### 2. Caching

Responses from external APIs are cached to reduce duplicate calls.

### 3. Database Indexes

MongoDB indexes are implemented on frequently queried fields:

```javascript
userSchema.index({ privyId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { 
  unique: true, 
  partialFilterExpression: { email: { $exists: true, $ne: null } }
});
scoreSchema.index({ privyId: 1 }, { unique: true });
```

### 4. Pagination

Large data sets (like Telegram messages) are paginated to improve performance.

## Security Implementation

### 1. Input Validation

All input is validated using Joi schemas before processing.

```javascript
const schemas = {
  scoreRequest: Joi.object({
    privyId: Joi.string(),
    twitterUsername: Joi.string(),
    walletAddress: Joi.string(),
    email: Joi.string().email()
  }).or('privyId', 'twitterUsername', 'walletAddress')
};
```

### 2. Rate Limiting

API endpoints are protected with rate limiting to prevent abuse.

```javascript
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
}));
```

### 3. Error Handling

Centralized error handling prevents exposing sensitive information.

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Server Error' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    error: message
  });
});
```

## Environment Configuration

The application uses environment variables for configuration, with defaults for development:

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mvp-backend

# External APIs
RAPIDAPI_KEY=your_rapidapi_key_here
MORALIS_API_KEY=your_moralis_api_key_here
VERIDA_API_BASE_URL=https://api.verida.network
```

## Testing Strategy

The backend implements unit, integration, and end-to-end tests:

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test interaction between components
3. **End-to-End Tests**: Test complete flows from HTTP request to database

## Deployment Architecture

The system is designed to be deployed to cloud platforms with the following architecture:

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Load     │────▶│  Backend   │────▶│  MongoDB   │
│  Balancer  │     │  Cluster   │     │   Atlas    │
└────────────┘     └────────────┘     └────────────┘
                         │
                         ▼
                   ┌────────────┐
                   │  External  │
                   │   APIs     │
                   └────────────┘
```

### Scaling Considerations

- Horizontal scaling through additional backend instances
- Database scaling through MongoDB Atlas
- Redis caching for frequently accessed data
- CDN for static assets

## Future Architecture Improvements

1. Microservices split by domain (Twitter, Blockchain, Verida)
2. Event-driven architecture using message queues
3. GraphQL API for more flexible data fetching
4. Serverless functions for specific compute-intensive operations
5. Real-time notifications using WebSockets 