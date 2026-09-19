import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot,
  setDoc, updateDoc, query, type DocumentData,
  type QueryConstraint, type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";

export type CloudCollection =
  | "users" | "skills" | "proposals" | "sessions" | "messages" | "reviews";

export function cloudCollection(name: CloudCollection) {
  return collection(db, name);
}

export async function putDoc(
  collectionName: CloudCollection, id: string, data: DocumentData,
) {
  await setDoc(doc(db, collectionName, id), data, { merge: true });
}

export async function updateCloudDoc(
  collectionName: CloudCollection, id: string, data: DocumentData,
) {
  await updateDoc(doc(db, collectionName, id), data);
}

export async function addCloudDoc(
  collectionName: CloudCollection, data: DocumentData,
) {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

export async function getCloudDoc(collectionName: CloudCollection, id: string) {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeCollection<T extends DocumentData>(
  collectionName: CloudCollection,
  constraints: QueryConstraint[],
  onData: (rows: Array<T & { id: string }>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<T & { id: string }>),
    error => onError?.(error),
  );
}

export async function removeCloudDoc(collectionName: CloudCollection, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}
