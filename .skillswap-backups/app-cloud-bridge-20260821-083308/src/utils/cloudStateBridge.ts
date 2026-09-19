import {
  collection, onSnapshot, query, where, type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import { addCloudDoc, putDoc, type CloudCollection } from "./firestoreRepository";

export function saveEntity(collectionName: CloudCollection, id: string, value: unknown) {
  return putDoc(collectionName, id, value as Record<string, unknown>);
}

export function createEntity(collectionName: CloudCollection, value: unknown) {
  return addCloudDoc(collectionName, value as Record<string, unknown>);
}

export function subscribeByUser<T>(
  collectionName: CloudCollection,
  field: string,
  uid: string,
  onRows: (rows: T[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, collectionName), where(field, "==", uid));
  return onSnapshot(
    q,
    snap => onRows(snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[]),
    err => onError?.(err),
  );
}
