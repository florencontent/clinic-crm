-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS in_rescheduling boolean DEFAULT false;
