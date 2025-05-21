// src/lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'
import { Database } from '../../types/database'

export const createClient = () => {
  return createServerComponentClient<Database>({ cookies });
};
  
//   return createServerComponentClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name) {
//           return cookieStore.get(name)?.value
//         },
//         set(name, value, options) {
//           try {
//             cookieStore.set(name, value, options)
//           } catch (error) {
//             // Handle or log any errors that occur during cookie setting
//             console.error('Error setting cookie:', error)
//           }
//         },
//         remove(name, options) {
//           try {
//             cookieStore.set(name, '', { ...options, maxAge: 0 })
//           } catch (error) {
//             // Handle or log any errors that occur during cookie removal
//             console.error('Error removing cookie:', error)
//           }
//         },
//       },
//     }
//   )
// }