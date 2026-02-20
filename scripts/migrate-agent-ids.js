#!/usr/bin/env node

/**
 * Migration script to fix stale assistant_id values in assistant_personalizations table
 * Maps old agent IDs to new YAML-based agent IDs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Mapping of old agent IDs to new agent IDs
const ID_MIGRATIONS = {
  'social_media_scheduler': 'social_media_agent',
  'smm_assistant': 'social_media_agent',
  'newsletter': 'newsletter_multi',
  'newsletter_agent': 'newsletter_multi',
  'sol_bot': 'SOL',
  'solar_agent': 'SOL',
  'content_repurposer_multi': 'content_repurposer',
};

async function migrateAgentIds() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔄 Starting agent ID migration...\n');

  for (const [oldId, newId] of Object.entries(ID_MIGRATIONS)) {
    try {
      // Find records with old ID
      const { data: records, error: selectError } = await supabase
        .from('assistant_personalizations')
        .select('id, user_id, assistant_id')
        .eq('assistant_id', oldId);

      if (selectError) {
        console.error(`❌ Error querying ${oldId}:`, selectError.message);
        continue;
      }

      if (!records || records.length === 0) {
        console.log(`  ⏭️  No records found with ID: ${oldId}`);
        continue;
      }

      console.log(`  📦 Found ${records.length} records with ID: ${oldId}`);

      // Check if user already has the new ID (to avoid duplicates)
      for (const record of records) {
        const { data: existing } = await supabase
          .from('assistant_personalizations')
          .select('id')
          .eq('user_id', record.user_id)
          .eq('assistant_id', newId)
          .single();

        if (existing) {
          // User already has new ID, delete the old record
          const { error: deleteError } = await supabase
            .from('assistant_personalizations')
            .delete()
            .eq('id', record.id);

          if (deleteError) {
            console.error(`    ❌ Error deleting duplicate for user ${record.user_id}:`, deleteError.message);
          } else {
            console.log(`    🗑️  Deleted duplicate ${oldId} for user ${record.user_id} (already has ${newId})`);
          }
        } else {
          // Update to new ID
          const { error: updateError } = await supabase
            .from('assistant_personalizations')
            .update({ assistant_id: newId })
            .eq('id', record.id);

          if (updateError) {
            console.error(`    ❌ Error updating ${oldId} → ${newId}:`, updateError.message);
          } else {
            console.log(`    ✅ Migrated: ${oldId} → ${newId} for user ${record.user_id}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${oldId}:`, error.message);
    }
  }

  console.log('\n✅ Migration complete!');
}

migrateAgentIds();
