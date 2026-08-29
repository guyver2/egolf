-- 002_wipe_game_data.sql
-- Clear game data on Rust rewrite; user accounts are preserved.

DELETE FROM hole_play_moves;
DELETE FROM hole_plays;
DELETE FROM holes;
