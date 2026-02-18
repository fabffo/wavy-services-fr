const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'wavy_token';
const USER_KEY = 'wavy_user';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setSession(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change'));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('auth-change'));
}

async function request(method: string, path: string, body?: any, isFormData = false): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  return data;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────
  auth: {
    async signInWithPassword(credentials: { email: string; password: string }) {
      const data = await request('POST', '/api/auth/login', credentials);
      if (data.token) {
        setSession(data.token, data.user);
      }
      return { data: { user: data.user ?? null, session: data.token ? { access_token: data.token, user: data.user } : null, otpRequired: data.otpRequired ?? false }, error: null };
    },

    async signUp(params: { email: string; password: string; options?: { data?: any; emailRedirectTo?: string } }) {
      const data = await request('POST', '/api/auth/signup', {
        email: params.email,
        password: params.password,
        metadata: params.options?.data ?? {},
      });
      return { data: { user: data.user ?? null }, error: null };
    },

    async signOut() {
      try { await request('POST', '/api/auth/logout'); } catch { /* ignore */ }
      clearSession();
      return { error: null };
    },

    async getSession() {
      const token = getToken();
      const stored = localStorage.getItem(USER_KEY);
      if (!token || !stored) return { data: { session: null }, error: null };
      try {
        const user = await request('GET', '/api/auth/me');
        return { data: { session: { access_token: token, user } }, error: null };
      } catch {
        clearSession();
        return { data: { session: null }, error: null };
      }
    },

    async getUser() {
      const token = getToken();
      if (!token) return { data: { user: null }, error: null };
      try {
        const user = await request('GET', '/api/auth/me');
        return { data: { user }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    },

    async resetPasswordForEmail(email: string, _opts?: any) {
      await request('POST', '/api/auth/reset-password', { email });
      return { error: null };
    },

    // Simule onAuthStateChange via événements custom
    onAuthStateChange(callback: (event: string, session: any) => void) {
      const handler = async () => {
        const { data } = await api.auth.getSession();
        const event = data.session ? 'SIGNED_IN' : 'SIGNED_OUT';
        callback(event, data.session);
      };
      window.addEventListener('auth-change', handler);
      // Fire once on mount
      handler();
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('auth-change', handler) } } };
    },
  },

  // ── DB (remplace supabase.from) ───────────────────────────────────
  from(table: string) {
    return new QueryBuilder(table);
  },

  // ── Edge Functions (remplace supabase.functions.invoke) ───────────
  functions: {
    async invoke(name: string, opts?: { body?: any }) {
      const data = await request('POST', `/api/functions/${name}`, opts?.body ?? {});
      return { data, error: null };
    },
  },

  // ── Storage ───────────────────────────────────────────────────────
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', path);
          formData.append('bucket', bucket);
          const data = await request('POST', '/api/upload', formData, true);
          return { data, error: null };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `${API_URL}/api/uploads/${bucket}/${path}` } };
        },
      };
    },
  },

  // ── Helpers directs ───────────────────────────────────────────────
  async get(path: string, params?: Record<string, string>) {
    const url = params ? `${path}?${new URLSearchParams(params)}` : path;
    return request('GET', url);
  },
  async post(path: string, body: any) {
    return request('POST', path, body);
  },
  async put(path: string, body: any) {
    return request('PUT', path, body);
  },
  async delete(path: string) {
    return request('DELETE', path);
  },
};

// ── QueryBuilder — interface fluente similaire à Supabase ─────────
class QueryBuilder {
  private table: string;
  private _method = 'GET';
  private _body: any = undefined;
  private _filters: string[] = [];
  private _select = '*';
  private _order: string | null = null;
  private _limit: number | null = null;
  private _single = false;
  private _id: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = '*') { this._select = fields; return this; }
  eq(col: string, val: any) { this._filters.push(`${col}=eq.${encodeURIComponent(val)}`); return this; }
  neq(col: string, val: any) { this._filters.push(`${col}=neq.${encodeURIComponent(val)}`); return this; }
  gt(col: string, val: any) { this._filters.push(`${col}=gt.${encodeURIComponent(val)}`); return this; }
  lt(col: string, val: any) { this._filters.push(`${col}=lt.${encodeURIComponent(val)}`); return this; }
  gte(col: string, val: any) { this._filters.push(`${col}=gte.${encodeURIComponent(val)}`); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this._order = `${col}:${opts?.ascending === false ? 'desc' : 'asc'}`; return this; }
  limit(n: number) { this._limit = n; return this; }
  single() { this._single = true; return this; }

  insert(body: any) { this._method = 'POST'; this._body = body; return this._exec(); }
  update(body: any) { this._method = 'PATCH'; this._body = body; return this; }
  delete() { this._method = 'DELETE'; return this; }

  // Appelé en fin de chaîne pour update/delete avec eq()
  private get _path(): string {
    let path = `/api/db/${this.table}`;
    const params: string[] = [];
    if (this._select !== '*') params.push(`select=${encodeURIComponent(this._select)}`);
    if (this._filters.length) params.push(...this._filters);
    if (this._order) params.push(`order=${this._order}`);
    if (this._limit) params.push(`limit=${this._limit}`);
    if (params.length) path += '?' + params.join('&');
    return path;
  }

  private async _exec(): Promise<{ data: any; error: any }> {
    try {
      let data: any;
      if (this._method === 'GET') {
        data = await request('GET', this._path);
      } else if (this._method === 'POST') {
        data = await request('POST', `/api/db/${this.table}`, this._body);
      } else if (this._method === 'PATCH') {
        data = await request('PATCH', this._path, this._body);
      } else if (this._method === 'DELETE') {
        data = await request('DELETE', this._path);
      }
      if (this._single) {
        return { data: Array.isArray(data) ? (data[0] ?? null) : data, error: null };
      }
      return { data: data ?? null, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  // Rend la promesse "thenable" pour les selects
  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return this._exec().then(resolve, reject);
  }
}

// Export nommé "supabase" pour compatibilité des imports existants
export const supabase = api;
