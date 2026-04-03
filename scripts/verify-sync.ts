import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verify() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const examId = 'e2000001-9999-9999-9999-000000000001';
  
  const { data, error } = await supabase
    .from('exams')
    .select('quest_data')
    .eq('id', examId)
    .single();

  if (error) {
    console.error(`❌ Error fetching exam: ${error.message}`);
    return;
  }

  const quest = data.quest_data.find(q => q.id === 'scratch-sum');
  if (quest) {
    console.log(`✅ Found scratch-sum in Exam!`);
    console.log(`📊 Structural Checks count: ${quest.structural_checks?.length || 0}`);
    console.log(`🔍 Checks:`, JSON.stringify(quest.structural_checks, null, 2));
  } else {
    console.log(`❌ scratch-sum NOT found in Exam quest_data.`);
  }
}

verify().catch(console.error);
