-- Improve concise but correct explanations for original JSS2 third-term practice.
-- Scoped and replay-safe: only explanations below the 35-character clarity threshold.
UPDATE public.questions
SET explanation = explanation ||
CASE
 WHEN question_text LIKE 'Find the pie-chart sector angle%' THEN
  ' A sector occupies this fraction of the full 360-degree circle.'
 WHEN question_text LIKE 'If tan %' THEN
  ' This is the vertical opposite side, not the sloping sightline.'
 WHEN question_text LIKE 'At elevation 45%' THEN
  ' Add eye height because the observer stands above ground level.'
 WHEN question_text LIKE 'Calculate the interior angle sum%' THEN
  ' This formula counts the n minus 2 triangles inside the polygon.'
 ELSE ' Check the rule and each substitution shown in the calculation.'
END,
updated_at=now()
WHERE source='THE GUIDE Original Worked Practice'
 AND tags ? 'jss2-third-term'
 AND length(coalesce(explanation,''))<35;