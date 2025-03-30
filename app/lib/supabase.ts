import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yxvqomhdfrxzbpxuehea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dnFvbWhkZnJ4emJweHVlaGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwODk5ODIsImV4cCI6MjA1ODY2NTk4Mn0.l6dFLDz_TPxjLPQsu97c3iiPq_2xMHmT4LZWaciRqUA';
export const supabase = createClient(supabaseUrl, supabaseKey);
