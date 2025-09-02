-- Fix security warnings by setting proper search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION calculate_exam_ranks(exam_name VARCHAR(50))
RETURNS VOID AS $$
BEGIN
  UPDATE exam_stats 
  SET rank = ranked.rank
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY best_score DESC, average_score DESC, total_tests DESC) as rank
    FROM exam_stats 
    WHERE exam_id = exam_name
  ) ranked
  WHERE exam_stats.id = ranked.id AND exam_stats.exam_id = exam_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;