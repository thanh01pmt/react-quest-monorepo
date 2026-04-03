/**
 * 🛸 Problem Sync Tool
 * ------------------------------------------------------------
 * Synchronizes local JSON problem definitions from 
 * packages/tin-hoc-tre-problems/data/ with the Supabase `public.exams` table.
 * 
 * Usage:
 *   pnpm sync-problems [--dry-run] [--force]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
  process.exit(1);
}

const PROBLEMS_DATA_DIR = path.resolve(process.cwd(), 'packages/tin-hoc-tre-problems/data');
const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log(`🚀 Starting Problem Sync... ${isDryRun ? '(DRY RUN)' : ''}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Load local problems
  const files = await fs.readdir(PROBLEMS_DATA_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const localProblems = new Map<string, any>();
  for (const file of jsonFiles) {
    const filePath = path.join(PROBLEMS_DATA_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    try {
      const json = JSON.parse(content);
      const id = json.id || json.problem_id;
      if (id) {
        localProblems.set(id, json);
      }
    } catch (e) {
      console.warn(`⚠️ Failed to parse ${file}: ${e.message}`);
    }
  }

  console.log(`📦 Loaded ${localProblems.size} local problem definitions.`);

  // 2. Fetch all exams
  const { data: exams, error } = await supabase
    .from('exams')
    .select('id, title, quest_data');

  if (error) {
    console.error(`❌ Failed to fetch exams: ${error.message}`);
    process.exit(1);
  }

  console.log(`🔍 Checking ${exams.length} exams in database...`);

  let updatedExamsCount = 0;
  let updatedProblemsTotal = 0;

  for (const exam of exams) {
    let isDirty = false;
    let updatedProblemsInExam = 0;
    
    const questData = Array.isArray(exam.quest_data) ? [...exam.quest_data] : [];
    console.log(`  - Exam "${exam.title}" contains IDs: ${questData.map(q => q.id || q.problem_id).join(', ')}`);
    
    for (let i = 0; i < questData.length; i++) {
      const challenge = questData[i];
      const challengeId = challenge.id || challenge.problem_id;
      
      if (localProblems.has(challengeId)) {
        const localData = localProblems.get(challengeId);
        
        // Deep compare or just replace? 
        // We replace to ensure all new fields (like structural_checks) are synced.
        // But we preserve existing UI fields if they are missing in local JSON.
        questData[i] = {
          ...challenge,
          ...localData
        };
        
        isDirty = true;
        updatedProblemsInExam++;
        updatedProblemsTotal++;
      }
    }

    if (isDirty) {
      console.log(`✨ Exam "${exam.title}" (${exam.id}): Updating ${updatedProblemsInExam} challenges.`);
      
      if (!isDryRun) {
        const { error: updateError } = await supabase
          .from('exams')
          .update({ quest_data: questData })
          .eq('id', exam.id);
          
        if (updateError) {
          console.error(`❌ Failed to update exam ${exam.id}: ${updateError.message}`);
        } else {
          updatedExamsCount++;
        }
      } else {
        updatedExamsCount++;
      }
    }
  }

  console.log(`\n✅ Sync completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Exams processed: ${exams.length}`);
  console.log(`   - Exams ${isDryRun ? 'to be updated' : 'updated'}: ${updatedExamsCount}`);
  console.log(`   - Total challenges ${isDryRun ? 'to be synced' : 'synced'}: ${updatedProblemsTotal}`);
  
  if (isDryRun) {
    console.log(`\n💡 This was a DRY RUN. No data was modified.`);
  }
}

main().catch(console.error);
