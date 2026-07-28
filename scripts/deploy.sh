#!/bin/bash
# ============================================================
# GenNews Deploy Script
# ============================================================
# Usage: bash scripts/deploy.sh
#
# This script helps deploy the GenNews frontend to Vercel.
# The smart contract must be deployed manually via GenLayer Studio.
# ============================================================

set -e

echo "🗞️  GenNews - Deployment Script"
echo "================================"
echo ""

# Check if contract address is set
if [ -f frontend/.env.local ]; then
    CONTRACT_ADDR=$(grep NEXT_PUBLIC_CONTRACT_ADDRESS frontend/.env.local | cut -d'=' -f2)
    if [ "$CONTRACT_ADDR" = "0x0000000000000000000000000000000000000000" ] || \
       [ "$CONTRACT_ADDR" = "0x79c3eeA98B9f2c70D05Cd19a7f978b756634Cdee" ] || \
       [ -z "$CONTRACT_ADDR" ]; then
        echo "⚠️  Contract address not set!"
        echo ""
        echo "Please deploy the contract first:"
        echo "1. Go to https://studio.genlayer.com"
        echo "2. Upload contracts/BettingPool.py"
        echo "3. Deploy the fixed contract and copy its NEW address"
        echo "4. Edit frontend/.env.local with your contract address"
        echo ""
        exit 1
    fi
    echo "✅ Contract address: $CONTRACT_ADDR"
else
    echo "⚠️  frontend/.env.local not found!"
    echo "Run: cp frontend/.env.example frontend/.env.local"
    exit 1
fi

echo ""

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "To deploy to Vercel:"
echo "  cd frontend"
echo "  npx vercel --prod"
echo ""
echo "Don't forget to set NEXT_PUBLIC_CONTRACT_ADDRESS in Vercel dashboard!"
