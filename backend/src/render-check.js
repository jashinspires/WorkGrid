// Simple diagnostic script for Render environment
console.log('--- Render Environment Check ---');
console.log('Node Version:', process.version);
console.log('Current Directory:', process.cwd());
console.log('Platform:', process.platform);

// List environment variables (names only for security)
console.log('Environment Variables Present:');
Object.keys(process.env).forEach(key => {
    if (key.includes('DB') || key.includes('SECRET') || key.includes('PASSWORD')) {
        console.log(`- ${key}: [HIDDEN]`);
    } else {
        console.log(`- ${key}: ${process.env[key]}`);
    }
});

console.log('--- End of Check ---');
