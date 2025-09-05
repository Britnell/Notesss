
--  v1

-- add 'Updated'

ALTER TABLE notes ADD COLUMN updated INTEGER;

-- migrate 

UPDATE notes 
SET updated = strftime('%s', date || 'T12:00:00') * 1000;
