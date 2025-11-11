// Script to generate bcrypt hash for admin password
const bcrypt = require('bcryptjs');

const password = 'admin123'; // Default password
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Bcrypt Hash:', hash);
console.log('\nAdd this to your migration file:');
console.log(`insert into public.admin_users (username, password_hash)`);
console.log(`values ('admin', '${hash}')`);
console.log(`on conflict (username) do nothing;`);

