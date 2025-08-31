import { getFirestore } from '@react-native-firebase/firestore';
import type { UserDoc } from '../models/user';

const db = getFirestore();

const USERS_COLLECTION = 'users';

export async function createUserDocument(authId: string): Promise<void> {
  const ref = db.collection<UserDoc>(USERS_COLLECTION).doc(authId);
  await ref.set({ authId }, { merge: true });
}
