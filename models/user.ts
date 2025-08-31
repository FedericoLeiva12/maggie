// Firestore document shape for an application user.
// For now we only persist the Firebase Auth UID as requested.
export type UserDoc = {
  authId: string;
};
