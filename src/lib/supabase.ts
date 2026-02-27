import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kstfpirukfifnmpoxbto.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdGZwaXJ1a2ZpZm5tcG94YnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDk2MDUsImV4cCI6MjA4NzAyNTYwNX0.7POYoDhaAxbb7y36-NxdRkIB4_Y3WTLuc-XfR_70-eo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
