/**
 * SMART UPSERT LOGIC FOR SBIR RECORDS
 * 
 * Handles intelligent updates between active and historical scrapers:
 * - Preserves live data when historical scraper tries to overwrite
 * - Always allows status transitions (Open → Closed)
 * - Always updates Q&A content if newer/more complete
 * - Tracks which scraper last updated each record
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SmartUpsertOptions {
  scraperType: 'active' | 'historical';
  logFn?: (msg: string) => void;
}

/**
 * Smart upsert that preserves live data and allows controlled updates
 */
export async function smartUpsertTopics(
  topics: any[],
  options: SmartUpsertOptions
) {
  const { scraperType, logFn = console.log } = options;
  
  let newRecords = 0;
  let updatedRecords = 0;
  let preservedRecords = 0;
  
  try {
    logFn(`   Starting smart upsert for ${topics.length} topics (scraper: ${scraperType})...`);
    
    // Tag all topics with scraper_source
    topics.forEach(topic => {
      topic.scraper_source = scraperType;
    });
    
    // Get composite keys
    const compositeKeys = topics.map(t => 
      ({ topic_number: t.topic_number, cycle_name: t.cycle_name })
    ).filter(k => k.topic_number && k.cycle_name);
    
    if (compositeKeys.length === 0) {
      logFn(`   ⚠ No valid composite keys found`);
      return { newRecords: 0, updatedRecords: 0, preservedRecords: 0 };
    }
    
    // Fetch existing records with their metadata and fields we might preserve
    const { data: existingRecords } = await supabase
      .from('sbir_final')
      .select('topic_number, cycle_name, data_freshness, scraper_source, qa_content, last_scraped, description, objective, phase_1_description, phase_2_description, phase_3_description')
      .or(compositeKeys.map(k => 
        `and(topic_number.eq.${k.topic_number},cycle_name.eq.${k.cycle_name})`
      ).join(','));
    
    // Create lookup map
    const existingMap = new Map(
      existingRecords?.map(r => [
        `${r.topic_number}||${r.cycle_name}`,
        r
      ]) || []
    );
    
    logFn(`   Found ${existingMap.size} existing records`);
    
    // Process each topic with smart logic
    const topicsToUpsert: any[] = [];
    
    for (const topic of topics) {
      const key = `${topic.topic_number}||${topic.cycle_name}`;
      const existing = existingMap.get(key);
      
      if (!existing) {
        // NEW RECORD - insert as-is
        newRecords++;
        topicsToUpsert.push(topic);
      } else {
        // EXISTING RECORD - apply smart update logic
        const shouldPreserve = 
          existing.data_freshness === 'live' && 
          topic.data_freshness === 'archived' &&
          scraperType === 'historical';
        
        if (shouldPreserve) {
          // PRESERVE MODE: Historical scraper trying to update live data
          logFn(`   ⚠ Preserving live data for ${topic.topic_number} (historical → live)`);
          
          // Create selective update (only update certain fields)
          const selectiveUpdate = {
            ...topic,
            // PRESERVE these fields from existing record
            description: existing.description || topic.description,
            objective: existing.objective || topic.objective,
            phase_1_description: existing.phase_1_description || topic.phase_1_description,
            phase_2_description: existing.phase_2_description || topic.phase_2_description,
            phase_3_description: existing.phase_3_description || topic.phase_3_description,
            
            // UPDATE Q&A if new data is more complete
            qa_content: (topic.qa_content && topic.qa_content.length > (existing.qa_content?.length || 0))
              ? topic.qa_content
              : existing.qa_content,
            
            // ALWAYS update these fields (status transitions, dates, metadata)
            status: topic.status,
            close_date: topic.close_date,
            open_date: topic.open_date,
            last_scraped: topic.last_scraped,
            
            // Keep original scraper_source (don't overwrite with 'historical')
            scraper_source: existing.scraper_source,
            data_freshness: existing.data_freshness // Keep as 'live'
          };
          
          preservedRecords++;
          topicsToUpsert.push(selectiveUpdate);
        } else {
          // NORMAL UPDATE - active scraper or historical updating historical
          updatedRecords++;
          topicsToUpsert.push(topic);
        }
      }
    }
    
    logFn(`   Upserting ${topicsToUpsert.length} topics...`);
    logFn(`   Breakdown: ${newRecords} new, ${updatedRecords} full update, ${preservedRecords} preserved`);
    
    // Perform upsert
    const { error: upsertError } = await supabase
      .from('sbir_final')
      .upsert(topicsToUpsert, {
        onConflict: 'topic_number,cycle_name',
        ignoreDuplicates: false
      });
    
    if (upsertError) {
      logFn(`   ❌ Upsert error: ${upsertError.message}`);
      throw upsertError;
    }
    
    logFn(`   ✅ Smart upsert complete`);
    
    return {
      newRecords,
      updatedRecords,
      preservedRecords
    };
    
  } catch (error) {
    logFn(`   ❌ Smart upsert failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

