import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./serviceaccountkey.json" with { type: 'json' };

let firebaseApp: any = null;
let firebaseAuth: any = null;
let firestore: any = null;

try {
  firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount as unknown as ServiceAccount),
      });
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
} catch (e) {
  console.warn("[Firebase Admin] fallback initialized:", e);
}

export { firebaseAuth, firestore };
export default firebaseApp;
