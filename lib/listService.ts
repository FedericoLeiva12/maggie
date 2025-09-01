import firestore, { getFirestore } from '@react-native-firebase/firestore';
import type { ListDoc } from '../models/list';

const db = getFirestore();
const LISTS_COLLECTION = 'lists';

function randomCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid ambiguous chars
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function generateUniqueCode(db: ReturnType<typeof getFirestore>, maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = randomCode(6);
    const snap = await db
      .collection<ListDoc>(LISTS_COLLECTION)
      .where('code', '==', code)
      .limit(1)
      .get();
    if (snap.empty) return code;
  }
  throw new Error('Could not generate unique invite code');
}

// Creates a new list. The creator is added to members.
export async function createList(ownerId: string, data: { title: string; description?: string }) {
  const now = firestore.FieldValue.serverTimestamp();
  const ref = db.collection<ListDoc>(LISTS_COLLECTION).doc();
  const code = await generateUniqueCode(db);
  const payload: ListDoc = {
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    ownerId,
    members: [ownerId],
    code,
    itemsTotal: 0,
    itemsDone: 0,
    createdAt: null,
    updatedAt: null,
  };
  await ref.set({ ...payload, createdAt: now as any, updatedAt: now as any }, { merge: true });
  return { id: ref.id };
}

// Returns all lists where the user is a member, ordered by updatedAt desc
export async function getListsForUser(userId: string) {
  const snap = await db
    .collection<ListDoc>(LISTS_COLLECTION)
    .where('members', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ListDoc) }));
}

// Returns a single list by id
export async function getListById(listId: string) {
  const ref = db.collection<ListDoc>(LISTS_COLLECTION).doc(listId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as ListDoc) };
}

// Find a list by its invite code
export async function getListByCode(code: string) {
  const snap = await db
    .collection<ListDoc>(LISTS_COLLECTION)
    .where('code', '==', code.trim().toUpperCase())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as ListDoc) };
}

// Subscribes to a single list by id. Returns an unsubscribe callback.
export function listenList(
  listId: string,
  onChange: (data: (ListDoc & { id: string }) | null) => void
) {
  const ref = db.collection<ListDoc>(LISTS_COLLECTION).doc(listId);
  return ref.onSnapshot((snap) => {
    if (!snap.exists) {
      onChange(null);
      return;
    }
    onChange({ id: snap.id, ...(snap.data() as ListDoc) });
  });
}

// Adds the user to the list members. Idempotent (arrayUnion)
export async function joinList(listId: string, userId: string) {
  const ref = db.collection<ListDoc>(LISTS_COLLECTION).doc(listId);
  // Use update for partial fields to satisfy typings and intent
  await ref.update({
    members: firestore.FieldValue.arrayUnion(userId) as any,
    updatedAt: firestore.FieldValue.serverTimestamp() as any,
  } as any);
}

// Join a list by invite code
export async function joinListByCode(code: string, userId: string) {
  const found = await getListByCode(code);
  if (!found) throw new Error('NOT_FOUND');
  await joinList(found.id, userId);
  return found;
}

// Generates an app link to share a list
export function shareLinkForList(listId: string) {
  return `maggie://join-list?id=${encodeURIComponent(listId)}`;
}
