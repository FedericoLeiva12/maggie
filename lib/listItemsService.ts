import firestore, { getFirestore } from '@react-native-firebase/firestore';
import type { ListItemDoc } from '@/models/listItem';
import type { ListDoc } from '@/models/list';

const db = getFirestore();
const LISTS_COLLECTION = 'lists';
const ITEMS_COLLECTION = 'items';

// Listen to list items in real-time. Items are ordered client-side so we can
// show incomplete first and then by recent updates to avoid Firestore composite indices.
export function listenItems(
  listId: string,
  onChange: (items: (ListItemDoc & { id: string })[]) => void
) {
  const ref = db
    .collection<ListDoc>(LISTS_COLLECTION)
    .doc(listId)
    .collection<ListItemDoc>(ITEMS_COLLECTION)
    .orderBy('createdAt', 'asc');

  return ref.onSnapshot((snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ListItemDoc) }));
    // Incomplete first, then by updatedAt desc within each group
    const sorted = rows
      .slice()
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1; // false first
        const at = a.updatedAt?.toMillis?.() ?? 0;
        const bt = b.updatedAt?.toMillis?.() ?? 0;
        return bt - at;
      });
    onChange(sorted);
  });
}

// Add a new item to the list and update list counters atomically.
export async function addItem(listId: string, userId: string, title: string, amount = 1) {
  const now = firestore.FieldValue.serverTimestamp();
  const listRef = db.collection<ListDoc>(LISTS_COLLECTION).doc(listId);
  const itemsRef = listRef.collection<ListItemDoc>(ITEMS_COLLECTION).doc();

  await db.runTransaction(async (tx) => {
    tx.set(itemsRef, {
      title: title.trim(),
      amount: Math.max(1, Math.floor(amount || 1)),
      done: false,
      createdAt: now as any,
      updatedAt: now as any,
      createdBy: userId,
    });

    const listSnap = await tx.get(listRef);
    const list = listSnap.data() as ListDoc | undefined;
    const itemsTotal = Math.max(0, (list?.itemsTotal ?? 0) + 1);
    tx.set(
      listRef,
      { itemsTotal, updatedAt: now as any },
      { merge: true }
    );
  });
}

// Update arbitrary item fields (e.g., title or amount)
export async function updateItem(
  listId: string,
  itemId: string,
  patch: Partial<Pick<ListItemDoc, 'title' | 'amount' | 'done'>>
) {
  const now = firestore.FieldValue.serverTimestamp();
  const itemRef = db
    .collection<ListDoc>(LISTS_COLLECTION)
    .doc(listId)
    .collection<ListItemDoc>(ITEMS_COLLECTION)
    .doc(itemId);
  await itemRef.set({ ...patch, updatedAt: now as any }, { merge: true });
}

// Toggle done state and keep list counters consistent via transaction.
export async function toggleItemDone(listId: string, itemId: string, nextDone: boolean) {
  const now = firestore.FieldValue.serverTimestamp();
  const listRef = db.collection<ListDoc>(LISTS_COLLECTION).doc(listId);
  const itemRef = listRef.collection<ListItemDoc>(ITEMS_COLLECTION).doc(itemId);

  await db.runTransaction(async (tx) => {
    const itemSnap = await tx.get(itemRef);
    if (!itemSnap.exists) return;
    const item = itemSnap.data() as ListItemDoc;
    const wasDone = !!item.done;
    if (wasDone === nextDone) {
      // no-op, but still update timestamp for ordering recency
      tx.set(itemRef, { updatedAt: now as any }, { merge: true });
      return;
    }

    tx.set(itemRef, { done: nextDone, updatedAt: now as any }, { merge: true });

    const listSnap = await tx.get(listRef);
    const list = listSnap.data() as ListDoc | undefined;
    const itemsDone = Math.max(0, (list?.itemsDone ?? 0) + (nextDone ? 1 : -1));
    tx.set(
      listRef,
      { itemsDone, updatedAt: now as any },
      { merge: true }
    );
  });
}

// Increase or decrease amount quickly, clamped to [1, 999].
export async function incrementAmount(listId: string, itemId: string, delta: number) {
  const now = firestore.FieldValue.serverTimestamp();
  const itemRef = db
    .collection(LISTS_COLLECTION)
    .doc(listId)
    .collection<ListItemDoc>(ITEMS_COLLECTION)
    .doc(itemId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists) return;
    const curr = (snap.data() as ListItemDoc).amount || 1;
    const next = Math.max(1, Math.min(999, (curr || 1) + delta));
    tx.set(itemRef, { amount: next, updatedAt: now as any }, { merge: true });
  });
}

// Remove an item and adjust counters when applicable.
export async function removeItem(listId: string, itemId: string) {
  const now = firestore.FieldValue.serverTimestamp();
  const listRef = db.collection<ListDoc>(LISTS_COLLECTION).doc(listId);
  const itemRef = listRef.collection<ListItemDoc>(ITEMS_COLLECTION).doc(itemId);

  await db.runTransaction(async (tx) => {
    const itemSnap = await tx.get(itemRef);
    if (!itemSnap.exists) return;
    const item = itemSnap.data() as ListItemDoc;

    tx.delete(itemRef);

    const listSnap = await tx.get(listRef);
    const list = listSnap.data() as ListDoc | undefined;
    const itemsTotal = Math.max(0, (list?.itemsTotal ?? 0) - 1);
    const itemsDone = Math.max(0, (list?.itemsDone ?? 0) - (item.done ? 1 : 0));
    tx.set(
      listRef,
      { itemsTotal, itemsDone, updatedAt: now as any },
      { merge: true }
    );
  });
}

