/**
 * ========================================
 * PASSWORD HASH GENERATOR
 * ========================================
 * This script generates a bcrypt hash for your admin password
 *
 * HOW TO USE:
 * 1. Run: node generate-password-hash.js
 * 2. It will output a hash for "admin123"
 * 3. Copy that hash into your Supabase admin_config table
 *
 * TO USE A DIFFERENT PASSWORD:
 * Change the PASSWORD variable below
 */

import bcrypt from 'bcryptjs'

// ========================================
// CONFIGURATION
// ========================================

// The password you want to hash
// CHANGE THIS to your desired password
const PASSWORD = 'admin123'

// Number of salt rounds (10 is standard)
const SALT_ROUNDS = 10

// ========================================
// GENERATE HASH
// ========================================

console.log('🔐 Password Hash Generator')
console.log('==========================')
console.log('')
console.log(`Password to hash: "${PASSWORD}"`)
console.log(`Salt rounds: ${SALT_ROUNDS}`)
console.log('')
console.log('Generating hash...')
console.log('')

// Generate the hash
const hash = bcrypt.hashSync(PASSWORD, SALT_ROUNDS)

console.log('✅ Hash generated successfully!')
console.log('')
console.log('Your bcrypt hash:')
console.log('------------------')
console.log(hash)
console.log('------------------')
console.log('')
console.log('📋 NEXT STEPS:')
console.log('')
console.log('1. Go to your Supabase Dashboard')
console.log('2. Navigate to Table Editor → admin_config')
console.log('3. Click on the existing row')
console.log('4. Replace the password_hash value with the hash above')
console.log('5. Save the changes')
console.log('')
console.log('Or run this SQL in the SQL Editor:')
console.log('')
console.log(`UPDATE admin_config SET password_hash = '${hash}';`)
console.log('')
console.log('Then try logging in with password: ' + PASSWORD)
