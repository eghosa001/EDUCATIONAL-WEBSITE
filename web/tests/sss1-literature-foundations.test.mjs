import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync('../supabase/migrations/20261009210000_sss1_literature_first_term_foundations.sql','utf8');
describe('SSS1 first-term literature foundations',()=>{
 it('labels original practice and avoids historical examination impersonation',()=>{ assert.match(sql,/THE GUIDE Original Literature Practice/);assert.doesNotMatch(sql,/INSERT INTO public\.learner_past_questions/);});
 it('maintains separate class and term alignment with duplicate protection',()=>{assert.match(sql,/Required SSS1 A\/B classes changed/);assert.match(sql,/NOT EXISTS\(SELECT 1 FROM public\.lessons/);assert.match(sql,/NOT EXISTS\(SELECT 1 FROM public\.questions prior/);});
 it('ships actual courses, complete lessons and reusable review content',()=>{assert.match(sql,/INSERT INTO public\.courses/);assert.match(sql,/INSERT INTO public\.lessons/);assert.match(sql,/INSERT INTO public\.flashcards/);assert.match(sql,/jsonb_array_length\(q\.value->'options'\)=4/);});
});
