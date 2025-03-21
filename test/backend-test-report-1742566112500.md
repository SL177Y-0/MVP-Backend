# Backend Test Report

**Test ID:** backend-test-1742566108939  
**Date:** 3/21/2025, 7:38:28 PM  
**Duration:** 3.54 seconds  

## Summary

- **Total Tests:** 14
- **Successful:** 11
- **Errors:** 1
- **Warnings:** 1
- **Success Rate:** 78.57%

## Database Schema

- **Collections:** users, scores, wallets
- **Email Index:** Properly configured

## Test Results

| Test | Status | Details |
|------|--------|--------|
| MongoDB Connection | ✅ | Connected to MongoDB |
| User Email Index | ✅ | Found proper email index with partial filter expression |
| Score Collection | ✅ | Score collection exists with indexes |
| Database Schema | ✅ | Found 3 collections |
| Check Server Port | ⚠️ | Port 5000 is already in use. Will use existing server. |
| Start Server | ❌ | Failed to start server |
| Create Test Users | ✅ | Created 4 test users |
| Wallet Connect | ✅ | Connected wallets for 4 users via API |
| Verify Wallet Status | ✅ | Verified wallet connection for 4 users |
| Check Score Records | ✅ | Verified score records for 4 users |
| Email Uniqueness | ✅ | Duplicate email correctly rejected |
| Null Email Handling | ✅ | Successfully created multiple users with null emails (6 total) |
| Cleanup | ✅ | Deleted 5 users and 5 score records |
| Stop Server | ⚠️ | Server was not started by this script, skipping stop |

## Errors

### Start Server

- **Message:** Failed to start server
- **Error:** Cannot read properties of undefined (reading 'warnings')
- **Timestamp:** 3/21/2025, 7:38:30 PM


## Recommendations

- Verify the server.js file location and ensure all dependencies are installed.
