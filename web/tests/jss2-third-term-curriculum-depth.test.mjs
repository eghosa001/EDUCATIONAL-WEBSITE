import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync('../supabase/migrations/20261009201500_jss2_third_term_curriculum_depth.sql','utf8');
describe('JSS2 third-term original content',()=>{
 it('labels new material as original practice',()=>{assert.match(sql,/THE GUIDE Original Worked Practice/);assert.doesNotMatch(sql,/INSERT INTO public\.learner_past_questions/);});
 it('uses class-bound topic mapping and duplicate guards',()=>{assert.match(sql,/Target JSS2 classes changed/);assert.match(sql,/NOT EXISTS \(SELECT 1 FROM public\.lessons/);assert.match(sql,/NOT EXISTS \(SELECT 1 FROM public\.questions old/);});
 it('includes lesson notes, flashcards and scored MCQ options',()=>{assert.match(sql,/INSERT INTO public\.lessons/);assert.match(sql,/INSERT INTO public\.flashcards/);assert.match(sql,/jsonb_array_length\(q->'options'\)=4/);});
});
