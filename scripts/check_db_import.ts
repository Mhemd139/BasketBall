import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log('Fetching trainers...');
  const { data: trainers, error: tErr } = await supabase.from('trainers').select('*');
  if (tErr) console.error(tErr);
  else console.log('Trainers:', trainers.map(t => ({ id: t.id, name_ar: t.name_ar, name_he: t.name_he })));

  console.log('Fetching classes...');
  const { data: classes, error: cErr } = await supabase.from('classes').select('*');
  if (cErr) console.error(cErr);
  else console.log('Classes:', classes.map(c => ({ id: c.id, name_ar: c.name_ar, name_he: c.name_he, trainer_id: c.trainer_id })));
}

checkDb();
