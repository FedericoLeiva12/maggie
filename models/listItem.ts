import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Firestore document shape for a grocery list item
export type ListItemDoc = {
  title: string; // item name (e.g., "Leche")
  amount: number; // quantity (e.g., 1, 2, 3)
  done: boolean; // whether the item is completed
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
  createdBy?: string; // uid of the creator (optional)
};

