const { execSync } = require('child_process');

console.log('🚀 Starting Railway deployment...\n');

try {
    // Check if railway CLI is installed
    console.log('Checking Railway CLI...');
    execSync('railway --version', { stdio: 'inherit' });
    
    // Check login status
    console.log('\n✓ Railway CLI found');
    console.log('Checking authentication...');
    
    try {
        execSync('railway whoami', { stdio: 'inherit' });
        console.log('✓ Already logged in');
    } catch (e) {
        console.log('Not logged in. Please run: railway login');
        process.exit(1);
    }
    
    // Deploy
    console.log('\n📦 Deploying to Railway...');
    execSync('railway up --detach', { stdio: 'inherit' });
    
    console.log('\n✅ Deployment initiated!');
    console.log('Run "railway status" to check deployment status');
    console.log('Run "railway open" to open your project in browser');
    
} catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
}
