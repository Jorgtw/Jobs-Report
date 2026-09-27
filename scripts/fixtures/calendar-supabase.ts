// Isolated browser fixture: no credentials, network requests or production data.
const query: any = new Proxy({}, { get: (_target,key) => key === 'then'
  ? (resolve: (result: unknown) => void) => resolve({data:[],error:null})
  : () => query });
export const supabase: any = { from: () => query, rpc: async () => ({data:[],error:null}),
  auth: { getSession: async () => ({data:{session:null},error:null}), onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}}) } };
