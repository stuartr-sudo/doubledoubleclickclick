// TEST: Verify User.list() works correctly
// This file can be deleted after testing

import { User } from './entities.js';

export async function testUserList() {
  try {
    console.log('🧪 Testing User.list()...');
    const users = await User.list();
    console.log('✅ User.list() returned:', users.length, 'users');
    console.log('Users:', users);
    return users;
  } catch (error) {
    console.error('❌ User.list() failed:', error);
    throw error;
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  console.log('Running user list test...');
  testUserList().catch(console.error);
}

