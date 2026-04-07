import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSql() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
      console.log("EXEC_SQL_NOT_EXISTS");
    } else {
      console.error("Error testing exec_sql:", error);
    }
  } else {
    console.log("EXEC_SQL_EXISTS");
  }
}

testSql();
