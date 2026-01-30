/**
 * Supabase Query Service
 * Provides a reusable interface for querying Supabase tables via backend API
 */

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';

export interface SupabaseFilter {
  column: string;
  operator: FilterOperator;
  value: any;
}

export interface SupabaseQueryOptions {
  table: string;
  filters?: SupabaseFilter[];
  select?: string;
  limit?: number;
  order?: {
    column: string;
    ascending?: boolean;
  };
}

export interface SupabaseQueryResponse<T = any> {
  success: boolean;
  data?: T[];
  error?: string;
}

/**
 * Query Supabase table via backend API
 * @param options Query options
 * @returns Promise with query results
 */
export async function querySupabase<T = any>(
  options: SupabaseQueryOptions
): Promise<SupabaseQueryResponse<T>> {
  try {
    if (!backendUrl) {
      throw new Error('VITE_BACKEND_URL environment variable is not set');
    }

    const response = await fetch(`${backendUrl}/api/supabase/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Query failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Supabase query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Query single record from Supabase table
 * @param options Query options
 * @returns Promise with single record or null
 */
export async function querySupabaseSingle<T = any>(
  options: SupabaseQueryOptions
): Promise<T | null> {
  const result = await querySupabase<T>({ ...options, limit: 1 });

  if (result.success && result.data && result.data.length > 0) {
    return result.data[0];
  }

  return null;
}

/**
 * Helper: Query by user_id
 */
export async function queryByUserId<T = any>(
  table: string,
  userId: string,
  additionalOptions?: Partial<SupabaseQueryOptions>
): Promise<SupabaseQueryResponse<T>> {
  return querySupabase<T>({
    table,
    filters: [{ column: 'user_id', operator: 'eq', value: userId }],
    ...additionalOptions,
  });
}

/**
 * Helper: Query by session_id
 */
export async function queryBySessionId<T = any>(
  table: string,
  sessionId: string,
  additionalOptions?: Partial<SupabaseQueryOptions>
): Promise<SupabaseQueryResponse<T>> {
  return querySupabase<T>({
    table,
    filters: [{ column: 'session_id', operator: 'eq', value: sessionId }],
    ...additionalOptions,
  });
}

/**
 * Helper: Query with multiple filters
 */
export async function queryWithFilters<T = any>(
  table: string,
  filters: SupabaseFilter[],
  additionalOptions?: Partial<SupabaseQueryOptions>
): Promise<SupabaseQueryResponse<T>> {
  return querySupabase<T>({
    table,
    filters,
    ...additionalOptions,
  });
}
