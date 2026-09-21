import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase project config (aiwise-research)
const firebaseConfig = {
  apiKey: "AIzaSyBJDCWrTnJclR0jUn2uqzjzG1JQYn99WOw",
  authDomain: "aiwise-research.firebaseapp.com",
  projectId: "aiwise-research",
  storageBucket: "aiwise-research.firebasestorage.app",
  messagingSenderId: "118720337711",
  appId: "1:118720337711:web:8795c209c1ba72e4cef3da"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// SECURITY: this client-side code can only write safely if you also set
// Firestore Security Rules in the Firebase Console (Build → Firestore
// Database → Rules). Without rules, the "ai_rules_log" collection is
// open to spam/rate exploitation from anyone who finds your config.
// Paste something like this as a starting point, then adjust to match
// your actual document shape:
//
//   rules_version = '2';
//   service cloud.firestore {
//     match /databases/{database}/documents {
//       match /ai_rules_log/{code}/entries/{entryId} {
//         allow read: if false;                 // no public reads
//         allow create: if request.resource.data.rules is string
//                       && request.resource.data.rules.size() < 5000;
//         allow update, delete: if false;        // entries are append-only
//       }
//     }
//   }
//
// This does not require Firebase Authentication — it relies on the
// unguessable per-student "code" as a path segment, which is a
// reasonable tradeoff for a short pilot, but is not a substitute for
// real auth in a production system.

// Exposed to script.js (module scripts have isolated scope)
// Each save creates a NEW timestamped entry under this student's code,
// instead of overwriting the previous one — this preserves a full
// engagement history (how many times they revised, and when),
// matching the paper's "Firebase Activity Log" instrument description.
window.saveAIRulesToFirebase = async function (code, rulesText) {
  await addDoc(collection(db, "ai_rules_log", code, "entries"), {
    rules: rulesText,
    timestamp: serverTimestamp()
  });
};


