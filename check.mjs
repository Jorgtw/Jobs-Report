import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqetgbqlxljhhcaggoke.supabase.co';
const supabaseAnonKey = 'sb_publishable_-VutZPQsHpnFTEEjizkGSw_vRAmuVvd';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing connection to Supabase...');
  
  const { data: selectData, error: selectError } = await supabase.from('reports').select('*').limit(1);
  if (selectError) {
    console.error('Select error:', selectError.message);
    return;
  }
  
  console.log('Columns available in reports table:');
  if (selectData && selectData.length > 0) {
    console.log(Object.keys(selectData[0]).join(', '));
  } else {
    console.log('No reports found to check columns.');
  }

  const { error: updateError } = await supabase.from('reports').update({ invoice_status: 'Pending' }).eq('id', '00000000-0000-0000-0000-000000000000');
  if (updateError) {
    console.error('Update EXPLICITLY returned error:', updateError.message);
  } else {
    console.log('Update query succeeded. Column exists in schema cache.');
  }
}

test();
