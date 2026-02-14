import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing connection to:', supabaseUrl)
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('relation "public.profiles" does not exist')) {
      console.log('✅ Connected to Supabase! (But tables are not created yet)')
    } else {
      console.error('❌ Connection failed:', error.message)
    }
  } else {
    console.log('✅ Connected to Supabase and tables are accessible!')
  }
}

testConnection()
