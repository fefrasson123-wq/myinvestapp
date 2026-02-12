import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verifica se o usuário é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifica se é admin
    const { data: isAdmin } = await supabaseClient.rpc('is_admin')
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Busca todos os usuários usando service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      throw usersError
    }

    // Busca perfis e roles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('*')

    // Busca investimentos por usuário
    const { data: investments } = await supabaseAdmin
      .from('investments')
      .select('user_id, id, name, category, current_value')

    // Busca assinaturas ativas com plano
    const { data: subscriptions } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, plan_id, status, plans:plan_id(name, display_name)')
      .eq('status', 'active')

    // Combina os dados
    const usersWithDetails = users.map(u => {
      const profile = profiles?.find(p => p.user_id === u.id)
      const userRoles = roles?.filter(r => r.user_id === u.id).map(r => r.role) || []
      const userInvestments = investments?.filter(i => i.user_id === u.id) || []
      const userSub = subscriptions?.find(s => s.user_id === u.id)
      const planName = userSub?.plans ? (userSub.plans as any).name : null
      
      return {
        id: u.id,
        email: u.email,
        display_name: profile?.display_name || profile?.username || 'Sem nome',
        username: profile?.username || null,
        whatsapp: profile?.whatsapp || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        roles: userRoles,
        investments_count: userInvestments.length,
        current_plan: planName,
        investments: userInvestments
      }
    })

    return new Response(
      JSON.stringify({ users: usersWithDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})