import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gqetgbqlxljhhcaggoke.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-VutZPQsHpnFTEEjizkGSw_vRAmuVvd';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegister() {
    console.log("Testing company registration...");
    try {
        const { data: cData, error: cErr } = await supabase
            .from('companies')
            .insert([{ name: 'Test Script Company', status: 'active' }])
            .select();

        if (cErr) {
            console.error("Company Error:", cErr);
            return;
        }
        console.log("Company created:", cData[0]);

        const sbObj = {
            name: 'Test Admin',
            username: 'testadmin_' + Math.random().toString(36).substring(7),
            password_hash: '123456',
            role: 'admin',
            status: 'active',
            company_id: cData[0].id,
            created_at: new Date().toISOString()
        };

        const { data: uData, error: uErr } = await supabase.from('workers').insert([sbObj]).select();

        if (uErr) {
            console.error("User Error:", uErr);
            return;
        }
        console.log("User created:", uData[0]);
        // Test login
        console.log("Testing login query...");
        const { data: loginData, error: loginErr } = await supabase
            .from('workers')
            .select('*')
            .eq('username', sbObj.username)
            .limit(1);

        console.log("Login error:", loginErr);
        console.log("Login data:", loginData);

        // Clean up
        await supabase.from('companies').delete().eq('id', cData[0].id);
        console.log("Test data cleaned up.");

    } catch (e) {
        console.error("Caught exception:", e);
    }
}

testRegister();
