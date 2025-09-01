import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Firestore document shape for a grocery list
export type ListDoc = {
  title: string;
  description?: string;
  ownerId: string;
  members: string[]; // user authIds
  // 6-character alphanumeric invite code. Optional for legacy docs.
  code?: string;
  itemsTotal: number;
  itemsDone: number;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
};
