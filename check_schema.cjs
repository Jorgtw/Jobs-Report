import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing connection to Supabase...');
  
  // 1. Try to select a single report to see its keys
  const { data: selectData, error: selectError } = await supabase.from('reports').select('*').limit(1);
  if (selectError) {
    console.error('Select error:', selectError.message);
  } else {
    console.log('Columns available in reports table:');
    if (selectData && selectData.length > 0) {
      console.log(Object.keys(selectData[0]));
    } else {
      console.log('No reports found.');
    }
  }

  // 2. Try an empty update to see if the column is recognized
  const { error: updateError } = await supabase.from('reports').update({ invoice_status: 'Pending' }).eq('id', '00000000-0000-0000-0000-000000000000');
  if (updateError) {
    console.error('Update invoice_status error:', updateError.message);
  } else {
    console.log('Update query with invoice_status succeeded (no rows affected).');
  }
}

test();
