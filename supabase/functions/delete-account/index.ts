import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create a Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify the user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error("User verification failed:", userError);
      throw new Error("Unauthorized: Invalid user session");
    }

    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);

    // Admin client to delete data and auth user
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete all user data from tables (order matters due to foreign keys)
    const tablesToDelete = [
      "investment_tags",  // Has FK to investments
      "transactions",     // Has FK to investments
      "investments",
      "personal_goals",
      "user_roles",
      "profiles",
    ];

    for (const table of tablesToDelete) {
      const { error: deleteError } = await adminClient
        .from(table)
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) {
        console.error(`Error deleting from ${table}:`, deleteError);
        // Continue with other tables even if one fails
      } else {
        console.log(`Deleted records from ${table}`);
      }
    }

    // Delete the auth user using admin API
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      throw new Error("Failed to delete authentication account");
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account deleted successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-account function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: error.message.includes("Unauthorized") ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
