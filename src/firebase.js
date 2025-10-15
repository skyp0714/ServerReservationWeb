// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
    authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VUE_APP_FIREBASE_APP_ID,
    measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const firestore = getFirestore(app);

// User Type Management
let currentUserType = 'guest'; // Default to guest

// Function to get current user's type by matching email
const getUserRole = async () => {
  const user = auth.currentUser;
  if (!user) return 'guest';
  
  try {
    // Query authorizedUsers collection where email equals current user's email
    const q = query(
      collection(firestore, 'authorizedUsers'),
      where('email', '==', user.email)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      if (docSnap.exists() && docSnap.data().userType) {
        currentUserType = docSnap.data().userType;
        return docSnap.data().userType;
      }
    }
    currentUserType = 'normal';
    return 'normal';
  } catch (error) {
    console.error('Error fetching user type:', error);
    currentUserType = 'normal';
    return 'normal';
  }
};

// Listen for auth state changes and update user type
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await getUserRole();
  } else {
    currentUserType = 'guest';
  }
});

// Helper function to check if current user is admin using userType field
const isAdmin = (check = false) => {
  if (check) {
    return currentUserType && currentUserType.toLowerCase() === 'admin';
  }
  return currentUserType === 'admin';
};

// Helper function to check if current user is at least a normal user
const isUser = () => currentUserType === 'normal' || currentUserType === 'admin';

// Export the services
export { 
    app, 
    auth, 
    firestore, 
    GoogleAuthProvider, 
    signInWithPopup,
    getUserRole,
    isAdmin,
    isUser
};