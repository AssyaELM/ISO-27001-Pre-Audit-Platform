const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(Boolean).filter(l=>!l.startsWith('#')).map(l=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1)];}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
(async()=>{
 const { data, error } = await supabase.auth.signInWithPassword({ email: 'usera@qa.com', password: 'QaPassword123!' });
 console.log('error', error && {message:error.message, status:error.status, code:error.code});
 console.log('session', !!data.session, 'user', !!data.user, data.user && data.user.email);
})().catch(e=>{ console.error(e); process.exit(1); });
