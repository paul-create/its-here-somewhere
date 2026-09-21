CREATE OR REPLACE FUNCTION fn_generateHomeCode()
RETURNS VARCHAR AS $$
DECLARE
  words TEXT[] := ARRAY[
    'rapid', 'bear', 'silk', 'happy', 'frozen', 'honest', 'bright', 'quiet',
    'swift', 'noble', 'vivid', 'gentle', 'smooth', 'strong', 'tender', 'warm',
    'cool', 'crisp', 'fresh', 'clean', 'clear', 'calm', 'bold', 'keen'
  ];
  code VARCHAR;
BEGIN
  code := words[floor(random() * array_length(words, 1)) + 1] || '-' ||
          words[floor(random() * array_length(words, 1)) + 1] || '-' ||
          words[floor(random() * array_length(words, 1)) + 1];
  RETURN code;
END;
$$ LANGUAGE plpgsql;