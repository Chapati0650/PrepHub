/*
  # Add option image columns to questions table

  1. Changes
    - Add `option_a_image` column to store image URL for option A
    - Add `option_b_image` column to store image URL for option B  
    - Add `option_c_image` column to store image URL for option C
    - Add `option_d_image` column to store image URL for option D

  2. Notes
    - These columns are nullable to support both text and image options
    - Existing questions will have NULL values for these new columns
    - Questions can have either text options OR image options OR both
*/

-- Add option image columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_a_image TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_b_image TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_c_image TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_d_image TEXT;