// Script to create admin user for VisionPolish
// Run this with Node.js after setting up your Supabase project

import { createClient } from '@supabase/supabase-js'

// Configuration - Update these with your Supabase project details
const SUPABASE_URL = 'https://aalsovtyejxitvkemcsl.supabase.co'
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY' // You need the service role key (not anon key)
const ADMIN_EMAIL = 'admin@admin.com'
const ADMIN_PASSWORD = 'admin123'

// Create Supabase client with service role key (has admin privileges)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...')
    
    // Step 1: Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: 'System Administrator'
      }
    })

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('⚠️  User already exists, updating to admin role...')
        
        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === ADMIN_EMAIL)
        
        if (existingUser) {
          // Update profile to admin
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: existingUser.id,
              role: 'admin',
              full_name: 'System Administrator',
              updated_at: new Date().toISOString()
            })
          
          if (updateError) {
            console.error('❌ Error updating profile:', updateError)
          } else {
            console.log('✅ Existing user updated to admin successfully!')
          }
        }
      } else {
        throw authError
      }
    } else {
      console.log('✅ User created successfully!')
      
      // Step 2: Create or update the profile with admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          role: 'admin',
          full_name: 'System Administrator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('❌ Error creating profile:', profileError)
      } else {
        console.log('✅ Admin profile created successfully!')
      }
    }

    // Step 3: Verify the admin was created
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .single()

    if (!verifyError && profile) {
      console.log('\n📋 Admin User Details:')
      console.log('========================')
      console.log(`Email: ${ADMIN_EMAIL}`)
      console.log(`Password: ${ADMIN_PASSWORD}`)
      console.log(`Role: ${profile.role}`)
      console.log(`Full Name: ${profile.full_name}`)
      console.log('========================')
      console.log('\n✨ You can now login at /admin/login')
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  }
}

// Run the script
createAdminUser()

/* 
  HOW TO USE THIS SCRIPT:
  
  1. Install dependencies (if not already installed):
     npm install @supabase/supabase-js
  
  2. Get your service role key from Supabase:
     - Go to your Supabase project dashboard
     - Settings > API
     - Copy the "service_role" key (NOT the anon key)
  
  3. Update the SUPABASE_SERVICE_KEY in this file
  
  4. Run the script:
     node scripts/create-admin.js
  
  Note: The service role key has admin privileges and should NEVER be exposed
  in client-side code or committed to version control.
*/