-- Migration 002: Add admin flag to users
-- Adds is_admin column and grants admin to doliver

ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;
