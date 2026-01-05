
const fs = require('fs');
const path = require('path');

// Manually load .env.local without dotenv
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            // Simple parse: KEY=VALUE
            const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.warn('Warning: Could not load .env.local');
}
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Missing');
console.log('HTTP_PROXY:', process.env.HTTP_PROXY || process.env.http_proxy || 'Not Set');
console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY || process.env.https_proxy || 'Not Set');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    console.log('Attempting to fetch posts...');
    const start = Date.now();
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('count')
            .limit(1);

        const duration = Date.now() - start;
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log(`Success! Connection took ${duration}ms.`);
            console.log('Data received:', data);
        }
    } catch (err) {
        console.error('Network/Client Error:', err);
    }
}

testConnection();
