#!/bin/bash

# CDN Control Panel API Test Script
# This script tests the basic API functionality

set -e

BASE_URL="http://localhost:8080/api/v1"
TOKEN=""

echo "================================"
echo "CDN Control Panel API Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
RESPONSE=$(curl -s http://localhost:8080/health)
if [[ $RESPONSE == *"ok"* ]]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Login
echo -e "${YELLOW}Test 2: User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "username": "admin",
        "password": "admin123"
    }')

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
    echo "Note: You need to create an admin user first:"
    echo "mysql -u root -p cdn_control -e \"INSERT INTO users (username, password_hash, role, status) VALUES ('admin', SHA2('admin123', 256), 'admin', 'active');\""
    exit 1
fi
echo ""

# Test 3: Get Config Version
echo -e "${YELLOW}Test 3: Get Config Version${NC}"
VERSION_RESPONSE=$(curl -s -X GET $BASE_URL/config/version \
    -H "Authorization: Bearer $TOKEN")

if [[ $VERSION_RESPONSE == *"version"* ]]; then
    echo -e "${GREEN}✓ Config version retrieved${NC}"
    echo "Response: $VERSION_RESPONSE"
else
    echo -e "${RED}✗ Failed to get config version${NC}"
    echo "Response: $VERSION_RESPONSE"
fi
echo ""

# Test 4: List Node Groups
echo -e "${YELLOW}Test 4: List Node Groups${NC}"
NODEGROUPS_RESPONSE=$(curl -s -X GET "$BASE_URL/node-groups?page=1&page_size=10" \
    -H "Authorization: Bearer $TOKEN")

if [[ $NODEGROUPS_RESPONSE == *"items"* ]]; then
    echo -e "${GREEN}✓ Node groups listed${NC}"
    echo "Response: $NODEGROUPS_RESPONSE"
else
    echo -e "${RED}✗ Failed to list node groups${NC}"
    echo "Response: $NODEGROUPS_RESPONSE"
fi
echo ""

# Test 5: List Line Groups
echo -e "${YELLOW}Test 5: List Line Groups${NC}"
LINEGROUPS_RESPONSE=$(curl -s -X GET "$BASE_URL/line-groups?page=1&page_size=10" \
    -H "Authorization: Bearer $TOKEN")

if [[ $LINEGROUPS_RESPONSE == *"items"* ]]; then
    echo -e "${GREEN}✓ Line groups listed${NC}"
    echo "Response: $LINEGROUPS_RESPONSE"
else
    echo -e "${RED}✗ Failed to list line groups${NC}"
    echo "Response: $LINEGROUPS_RESPONSE"
fi
echo ""

# Test 6: Test Authentication (should fail without token)
echo -e "${YELLOW}Test 6: Test Authentication (should fail)${NC}"
AUTH_TEST_RESPONSE=$(curl -s -X GET $BASE_URL/node-groups)

if [[ $AUTH_TEST_RESPONSE == *"authorization"* ]] || [[ $AUTH_TEST_RESPONSE == *"1004"* ]]; then
    echo -e "${GREEN}✓ Authentication protection working${NC}"
else
    echo -e "${RED}✗ Authentication not working properly${NC}"
    echo "Response: $AUTH_TEST_RESPONSE"
fi
echo ""

echo "================================"
echo -e "${GREEN}All tests completed!${NC}"
echo "================================"
