import fs from 'fs';
import { performance } from 'perf_hooks';

async function QA() {
  const URL = 'http://127.0.0.1:3103';
  const email = 'usera@qa.com';
  const password = 'QaPassword123!';
  let cookie = '';
  
  async function measure(name, fetchFn) {
    const start = performance.now();
    const res = await fetchFn();
    const end = performance.now();
    
    // Attempt to parse json or text just to consume body
    try { await res.text(); } catch(e){}
    
    console.log(`${name}: ${Math.round(end - start)}ms [HTTP ${res.status}]`);
    return res;
  }

  // 1. Landing
  await measure('Landing_FirstLoad', () => fetch(URL + '/'));
  
  // 2. Login Page
  await measure('Login_FirstLoad', () => fetch(URL + '/login'));
  
  // Login via API to get cookie
  const loginRes = await measure('API_Login', () => fetch(URL + '/api/auth/callback', { // We don't have callback, we can use supabase directly
    method: 'POST',
    // ... wait, we can't easily login to next.js unless we use supabase JS client.
  }));
}
QA();
