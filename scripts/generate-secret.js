#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 NEXTAUTH_SECRET Generator');
console.log('============================\n');

// Generate a secure random secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('Generated NEXTAUTH_SECRET:');
console.log('--------------------------');
console.log(secret);
console.log('\n📋 Copy this value to your Coolify environment variables:');
console.log(`NEXTAUTH_SECRET=${secret}`);
console.log('\n⚠️  Important:');
console.log('- Keep this secret secure and never commit it to version control');
console.log('- Use this exact value in your Coolify environment variables');
console.log('- This secret is used to encrypt JWT tokens and sessions');
console.log('\n✅ Secret generated successfully!');
