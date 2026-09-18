import { supabase } from '../lib/supabaseClient';

export type CloudCollection =
  | "users" | "skills" | "proposals" | "sessions" | "messages" | "reviews";

export type DocumentData = Record<string, any>;
export type Unsubscribe = () => void;

export function cloudCollection(name: CloudCollection) {
  return name;
}

export async function putDoc(
  collectionName: CloudCollection, id: string, data: DocumentData,
) {
  const { error } = await supabase
    .from(collectionName)
    .upsert({ id, ...data });

  if (error) throw new Error(`Supabase putDoc error (${collectionName}): ${error.message}`);
}

export async function updateCloudDoc(
  collectionName: CloudCollection, id: string, data: DocumentData,
) {
  const { error } = await supabase
    .from(collectionName)
    .update(data)
    .eq('id', id);

  if (error) throw new Error(`Supabase updateCloudDoc error (${collectionName}): ${error.message}`);
}

export async function addCloudDoc(
  collectionName: CloudCollection, data: DocumentData,
) {
  const { data: inserted, error } = await supabase
    .from(collectionName)
    .insert([data])
    .select('id')
    .single();

  if (error) throw new Error(`Supabase addCloudDoc error (${collectionName}): ${error.message}`);
  return inserted.id;
}

export async function getCloudDoc(collectionName: CloudCollection, id: string) {
  const { data, error } = await supabase
    .from(collectionName)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Supabase getCloudDoc error (${collectionName}): ${error.message}`);
  return data ? { id: data.id, ...data } : null;
}

export function subscribeCollection<T extends DocumentData>(
  collectionName: CloudCollection,
  constraints: any[],
  onData: (rows: Array<T & { id: string }>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const fetchInitial = async () => {
    let queryBuilder = supabase.from(collectionName).select('*');
    const { data, error } = await queryBuilder;
    if (error) {
      if (onError) onError(new Error(error.message));
      return;
    }
    if (data) {
      onData(data as Array<T & { id: string }>);
    }
  };

  fetchInitial();

  const channel = supabase
    .channel(`public:${collectionName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: collectionName },
      () => {
        fetchInitial();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function removeCloudDoc(collectionName: CloudCollection, id: string) {
  const { error } = await supabase
    .from(collectionName)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Supabase removeCloudDoc error (${collectionName}): ${error.message}`);
}
