import fs from 'fs';
import path from 'path';

function runDeepDiagnosis(dir = '.') {
    console.log('==================================================');
    console.log('  SKILLSWAP 5.0 DEEP ARCHITECTURAL DIAGNOSTIC');
    console.log('==================================================\n');

    let missingModules = [];
    let foundModules = [];
    let todoItems = [];

    // Define core features required for a P2P marketplace app
    const featureSignatures = {
        'Authentication (Login/Signup)': ['auth', 'login', 'signup', 'register', 'firebase'],
        'Skill Listings / Marketplace': ['list', 'skill', 'market', 'exchange', 'feed', 'browse'],
        'Real-time Chat / Messaging': ['chat', 'message', 'inbox', 'conversation'],
        'User Profiles': ['profile', 'user', 'account', 'bio'],
        'Payments / Transactions': ['pay', 'stripe', 'mpesa', 'wallet', 'checkout']
    };

    let detectedFiles = [];

    const srcDir = path.join(dir, 'src');
    if (!fs.existsSync(srcDir)) {
        console.log('[!] CRITICAL: No "src" folder found. Is your source code in a different directory?\n');
        return;
    }

    // Recursively scan src/ for files and TODOs
    function scan(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (let entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.git') {
                    scan(fullPath);
                }
            } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                detectedFiles.push(entry.name.toLowerCase());

                // Check for TODOs
                const matches = content.match(/\/\/\s*TODO:?(.*)/gi);
                if (matches) {
                    matches.forEach(m => todoItems.push({ file: entry.name, text: m.trim() }));
                }
            }
        }
    }

    scan(srcDir);

    // Evaluate feature presence based on filenames
    console.log('--- CORE P2P FEATURE AUDIT ---');
    for (const [feature, keywords] of Object.entries(featureSignatures)) {
        const isPresent = detectedFiles.some(file => 
            keywords.some(kw => file.includes(kw))
        );
        
        if (isPresent) {
            foundModules.push(feature);
            console.log(` [✓] ${feature}: Detected`);
        } else {
            missingModules.push(feature);
            console.log(` [✗] ${feature}: Missing or unlinked components`);
        }
    }

    // Report Recommendations & Improvements
    console.log('\n--- IMPROVEMENT & COMPLETION SUGGESTIONS ---');
    if (missingModules.length > 0) {
        console.log('\n[💡] What to implement next to complete SkillSwap 5.0:');
        missingModules.forEach(mod => {
            if (mod.includes('Payments')) {
                console.log(`   - Integrate mobile payments: Since Stripe has limitations, implement an M-Pesa Daraja API wrapper for local transaction settlements.`);
            } else if (mod.includes('Chat')) {
                console.log(`   - Build a chat interface: Users need to negotiate skill trades live via WebSockets or Firebase Firestore real-time listeners.`);
            } else {
                console.log(`   - Implement module: Create components and views for handling ${mod}.`);
            }
        });
    } else {
        console.log('\n[✓] All core structural module types detected!');
    }

    if (todoItems.length > 0) {
        console.log(`\n[!] Pending Code Tasks (${todoItems.length} TODOs found):`);
        todoItems.slice(0, 5).forEach(t => console.log(`   - [${t.file}] ${t.text}`));
        if (todoItems.length > 5) {
            console.log(`   ...and ${todoItems.length - 5} more TODOs.`);
        }
    }

    console.log('\n==================================================');
    console.log('Deep diagnosis finished.');
}

runDeepDiagnosis();
