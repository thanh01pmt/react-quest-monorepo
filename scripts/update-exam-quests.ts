import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
  process.exit(1);
}

const EXAM_ID = 'e2000001-9999-9999-9999-000000000001';
const NEW_QUESTS = [
  { id: 'dem-ngay' },
  { id: 'chia-het-2-1' }
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Fetch current quest_data
  const { data: exam, error: fetchError } = await supabase
    .from('exams')
    .select('quest_data')
    .eq('id', EXAM_ID)
    .single();

  if (fetchError) {
    console.error(`❌ Failed to fetch exam: ${fetchError.message}`);
    process.exit(1);
  }

  let questData = Array.isArray(exam.quest_data) ? [...exam.quest_data] : [];
  
  // 2. Add new quests if not already present
  for (const newQuest of NEW_QUESTS) {
    if (!questData.some(q => (q.id || q.problem_id) === newQuest.id)) {
      questData.push(newQuest);
      console.log(`➕ Adding quest: ${newQuest.id}`);
    } else {
      console.log(`ℹ️ Quest already exists: ${newQuest.id}`);
    }
  }

  // 3. Update exam
  const { error: updateError } = await supabase
    .from('exams')
    .update({ quest_data: questData })
    .eq('id', EXAM_ID);

  if (updateError) {
    console.error(`❌ Failed to update exam: ${updateError.message}`);
    process.exit(1);
  }

  console.log(`✅ Exam updated successfully! Current quests: ${questData.map(q => q.id || q.problem_id).join(', ')}`);
}

main().catch(console.error);
