import 'dotenv/config';
import { supabase } from './db';

async function main() {
  const { count } = await supabase.from('questions').select('id', { count: 'exact', head: true });
  console.log('Total questions remaining:', count);
}
main();
