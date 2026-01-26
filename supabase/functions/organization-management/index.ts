import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get auth user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !authData.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = authData.user.id

    // Get request body
    const body = await req.json()

    // Route requests based on action
    if (req.method === 'POST') {
      const { action, payload } = body

      switch (action) {
        case 'CREATE_ORGANIZATION':
          return await createOrganization(supabase, userId, payload)
        case 'UPDATE_ORGANIZATION':
          return await updateOrganization(supabase, userId, payload)
        case 'DELETE_ORGANIZATION':
          return await deleteOrganization(supabase, userId, payload)
        case 'INVITE_MEMBER':
          return await inviteMember(supabase, userId, payload)
        case 'REMOVE_MEMBER':
          return await removeMember(supabase, userId, payload)
        case 'UPDATE_MEMBER_ROLE':
          return await updateMemberRole(supabase, userId, payload)
        case 'UPDATE_ORG_SETTINGS':
          return await updateOrgSettings(supabase, userId, payload)
        case 'CHANGE_PLAN':
          return await changePlan(supabase, userId, payload)
        default:
          return new Response('Invalid action', { status: 400 })
      }
    } else {
      return new Response('Method not allowed', { status: 405 })
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})

// Create a new organization
async function createOrganization(supabase: any, userId: string, payload: any) {
  const { name, slug, logo_url, primary_color, custom_domain } = payload

  // Validate inputs
  if (!name || !slug) {
    return new Response('Name and slug are required', { status: 400 })
  }

  // Check if slug is available
  const { data: existingSlug, error: slugError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (slugError && slugError.code !== 'PGRST116') {
    return new Response('Error checking slug availability', { status: 500 })
  }

  if (existingSlug) {
    return new Response('Slug already exists', { status: 400 })
  }

  // Create organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert([
      {
        name,
        slug,
        logo_url,
        primary_color,
        custom_domain,
        is_active: true
      }
    ])
    .select()
    .single()

  if (orgError) {
    return new Response('Error creating organization', { status: 500 })
  }

  // Create organization settings
  await supabase
    .from('organization_settings')
    .insert([
      {
        organization_id: organization.id,
        settings: {
          notifications: true,
          custom_branding: false,
          allow_signups: true,
          dark_mode: false,
          timezone: 'UTC'
        }
      }
    ])

  // Create default subscription
  await supabase
    .from('organization_subscriptions')
    .insert([
      {
        organization_id: organization.id,
        plan_id: '1', // Free plan
        status: 'active',
        starts_at: new Date().toISOString()
      }
    ])

  // Add creator as owner
  await supabase
    .from('organization_roles')
    .insert([
      {
        organization_id: organization.id,
        user_id: userId,
        role: 'owner',
        granted_by: userId
      }
    ])

  // Update user profile with organization id
  await supabase
    .from('user_profiles')
    .update({ organization_id: organization.id })
    .eq('id', userId)

  return new Response(JSON.stringify({
    success: true,
    data: organization
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Update an organization
async function updateOrganization(supabase: any, userId: string, payload: any) {
  const { organization_id, updates } = payload

  // Check if user has permission to update
  const { data: role, error: roleError } = await supabase
    .from('organization_roles')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', userId)
    .single()

  if (roleError || !['owner', 'admin'].includes(role?.role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Validate updates
  if (updates.slug) {
    const { data: existingSlug, error: slugError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', updates.slug)
      .neq('id', organization_id)
      .single()

    if (slugError && slugError.code !== 'PGRST116') {
      return new Response('Error checking slug availability', { status: 500 })
    }

    if (existingSlug) {
      return new Response('Slug already exists', { status: 400 })
    }
  }

  const { data: organization, error: updateError } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', organization_id)
    .select()
    .single()

  if (updateError) {
    return new Response('Error updating organization', { status: 500 })
  }

  return new Response(JSON.stringify({
    success: true,
    data: organization
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Delete an organization
async function deleteOrganization(supabase: any, userId: string, payload: any) {
  const { organization_id } = payload

  // Check if user has permission to delete
  const { data: role, error: roleError } = await supabase
    .from('organization_roles')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', userId)
    .single()

  if (roleError || role?.role !== 'owner') {
    return new Response('Unauthorized', { status: 401 })
  }

  // Delete organization
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organization_id)

  if (error) {
    return new Response('Error deleting organization', { status: 500 })
  }

  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Invite a member to an organization
async function inviteMember(supabase: any, userId: string, payload: any) {
  const { organization_id, email } = payload

  // Check if inviter has permission
  const { data: role, error: roleError } = await supabase
    .from('organization_roles')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', userId)
    .single()

  if (roleError || !['owner', 'admin'].includes(role?.role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Check if user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, organization_id')
    .eq('email', email)
    .single()

  if (userError && userError.code !== 'PGRST116') {
    return new Response('Error finding user', { status: 500 })
  }

  if (!user) {
    return new Response('User not found', { status: 404 })
  }

  // Check if user is already in organization
  if (user.organization_id === organization_id) {
    return new Response('User is already in this organization', { status: 400 })
  }

  // Update user's organization
  const { error: updateError } = await supabase
    .from('users')
    .update({ organization_id: organization_id })
    .eq('id', user.id)

  if (updateError) {
    return new Response('Error updating user', { status: 500 })
  }

  // Create role entry
  const { error: roleError2 } = await supabase
    .from('organization_roles')
    .insert([
      {
        organization_id: organization_id,
        user_id: user.id,
        role: 'member',
        granted_by: userId
      }
    ])

  if (roleError2) {
    return new Response('Error creating role', { status: 500 })
  }

  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Remove a member from an organization
async function removeMember(supabase: any, userId: string, payload: any) {
  const { organization_id, user_id } = payload

  // Check if requester has permission
  const { data: role, error: roleError } = await supabase
    .from('organization_roles')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', userId)
    .single()

  if (roleError || !['owner', 'admin'].includes(role?.role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Check if user is trying to remove themselves
  if (userId === user_id) {
    return new Response('Cannot remove yourself', { status: 400 })
  }

  // Remove role
  const { error: roleError2 } = await supabase
    .from('organization_roles')
    .delete()
    .eq('organization_id', organization_id)
    .eq('user_id', user_id)

  if (roleError2) {
    return new Response('Error removing role', { status: 500 })
  }

  // Update user's organization
  const { error: updateError } = await supabase
    .from('users')
    .update({ organization_id: null })
    .eq('id', user_id)

  if (updateError) {
    return new Response('Error updating user', { status: 500 })
  }

  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Update a member's role
async function updateMemberRole(supabase: any, userId: string, payload: any) {
  const { organization_id, user_id, role } = payload

  // Check if requester has permission
  const { data: requesterRole, error: roleError } = await supabase
    .from('organization_roles')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', userId)
    .single()

  if (roleError || !['owner', 'admin'].includes(requesterRole?.role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Validate role
  const validRoles = ['owner', 'admin', 'member']
  if (!validRoles.includes(role)) {
    return new Response('Invalid role', { status: 400 })
  }

  // Check if user exists in organization
  const { data: userRole, error: userRoleError } = await supabase
    .from('organization_roles')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('user_id', user_id)
    .single()

  if (userRoleError) {
    return new Response('User not in organization', { status: 404 })
  }

  // Update role
  const { error: updateError } = await supabase
    .from('organization_roles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('organization_id', organization_id)
    .eq('user_id', user_id)

  if (updateError) {
    return new Response('Error updating role', { status: 500 })
  }

  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Update organization settings
async function updateOrgSettings(supabase: any, userId: string, payload: any) {
  const { organization_id, settings } = payload

  // Check if user has permission
  const { data: role, error: roleError } = await supabase
    .from('organization_roles')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', userId)
    .single()

  if (roleError || !['owner', 'admin'].includes(role?.role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Update settings
  const { data, error } = await supabase
    .from('organization_settings')
    .upsert({
      organization_id: organization_id,
      settings: settings
    })
    .select()
    .single()

  if (error) {
    return new Response('Error updating settings', { status: 500 })
  }

  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Change organization plan
async function changePlan(supabase: any, userId: string, payload: any) {
  const { organization_id, plan_id } = payload

  // Check if user has permission
  const { data: role, error: roleError } = await supabase
    .from('organization_roles')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', userId)
    .single()

  if (roleError || !['owner', 'admin'].includes(role?.role)) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Update subscription
  const { data: subscription, error } = await supabase
    .from('organization_subscriptions')
    .upsert({
      organization_id: organization_id,
      plan_id: plan_id,
      status: 'active',
      starts_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return new Response('Error updating subscription', { status: 500 })
  }

  return new Response(JSON.stringify({
    success: true,
    data: subscription
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
