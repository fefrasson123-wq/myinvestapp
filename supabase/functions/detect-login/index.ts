import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GeoData {
  ip: string;
  city: string;
  region: string;
  country: string;
  location: string;
}

async function getGeoFromIP(ip: string): Promise<GeoData> {
  try {
    // Use ip-api.com (free, no key needed, 45 req/min)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,query`);
    const data = await res.json();
    
    if (data.status === 'success') {
      return {
        ip: data.query || ip,
        city: data.city || 'Desconhecido',
        region: data.regionName || 'Desconhecido',
        country: data.country || 'Desconhecido',
        location: [data.city, data.regionName, data.country].filter(Boolean).join(', '),
      };
    }
  } catch (err) {
    console.error('Geolocation error:', err);
  }
  
  return {
    ip,
    city: 'Desconhecido',
    region: 'Desconhecido',
    country: 'Desconhecido',
    location: 'Local não disponível',
  };
}

function parseUserAgent(ua: string): string {
  if (!ua) return 'Dispositivo desconhecido';
  
  let browser = 'Navegador';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  let os = '';
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';
  
  return os ? `${browser} no ${os}` : browser;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    // Get IP from headers (forwarded by proxy) or request body
    const body = await req.json().catch(() => ({}));
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || body.ip 
      || 'IP não disponível';
    
    const userAgent = body.userAgent || req.headers.get('user-agent') || '';
    const device = parseUserAgent(userAgent);

    // Get geolocation from IP
    const geo = await getGeoFromIP(ip);
    console.log(`Login detected for ${userEmail} from ${geo.location} (${geo.ip})`);

    // Check previous logins for this user
    const { data: previousLogins } = await supabase
      .from('login_history')
      .select('ip_address, city, country, device')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Determine if suspicious: new IP + new location combo
    let isSuspicious = false;
    if (previousLogins && previousLogins.length > 0) {
      const knownIPs = new Set(previousLogins.map(l => l.ip_address));
      const knownCities = new Set(previousLogins.map(l => l.city));
      const knownCountries = new Set(previousLogins.map(l => l.country));
      
      const isNewIP = !knownIPs.has(geo.ip);
      const isNewCity = !knownCities.has(geo.city);
      const isNewCountry = !knownCountries.has(geo.country);
      
      // Suspicious if new country OR (new IP AND new city)
      isSuspicious = isNewCountry || (isNewIP && isNewCity);
    }
    // First login ever is not suspicious

    // Save login to history
    const { error: insertError } = await supabase
      .from('login_history')
      .insert({
        user_id: userId,
        ip_address: geo.ip,
        user_agent: userAgent,
        device,
        location: geo.location,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        is_suspicious: isSuspicious,
      });

    if (insertError) {
      console.error('Error saving login history:', insertError);
    }

    // Send alert email if suspicious
    if (isSuspicious) {
      console.log(`⚠️ Suspicious login detected for ${userEmail}!`);
      
      // Get username from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('user_id', userId)
        .single();

      const username = profile?.display_name || profile?.username || 'Investidor';
      const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

      // Use service role to send email
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          type: 'suspicious-login',
          to: userEmail,
          data: {
            username,
            device,
            location: geo.location,
            ip: geo.ip,
            time: now,
            secureAccountUrl: 'https://myinvestapp.com.br/auth',
          }
        }
      });

      console.log(`Alert email sent to ${userEmail}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      suspicious: isSuspicious,
      location: geo.location,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Error in detect-login:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
