<template>
  <div class="login">
    <h1>FAST Lab User Login<br>(use your illinois netID)</h1>
    <button @click="googleSignIn" class="google-btn">
      <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google Logo" class="google-logo" />
      <span>Sign in with Google</span>
    </button>
    <div v-if="loginError" class="error-message">
      {{ loginError }}
    </div>
    <div class="login-info">
      <p>Only authorized members can log in to this system.</p>
      <p>Please contact an administrator if you need access.</p>
    </div>
  </div>
</template>

<script>
import { auth, GoogleAuthProvider, signInWithPopup, firestore } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import '@/assets/styles/components/GoogleLogin.css'

export default {
  name: 'GoogleLogin',
  data() {
    return {
      loginError: null
    }
  },
  methods: {
    async googleSignIn() {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const userEmail = result.user.email;
        const displayName = result.user.displayName;
        
        const authResult = await this.checkUserAuthorization(userEmail, displayName);
        
        if (!authResult.authorized) {
          this.loginError = "You are not authorized to access this system. Please contact an administrator.";
          await auth.signOut();
          return;
        }
        
        localStorage.setItem('userType', authResult.userType);
        this.$router.push('/home');
      } catch (error) {
        console.error('Error signing in:', error);
        this.loginError = "Login failed. Please try again.";
      }
    },
    
    async checkUserAuthorization(email, displayName) {
      try {
        const usersRef = collection(firestore, 'authorizedUsers');
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return { authorized: false };
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        let userType = userData.userType;
        
        if (!userType) {
          userType = userData.isAdmin ? 'admin' : 'normal';
        }
        
        if (displayName && (!userData.name || userData.name === '')) {
          await updateDoc(doc(firestore, 'authorizedUsers', userDoc.id), {
            name: displayName
          });
        }
        
        return { authorized: true, userType };
      } catch (error) {
        console.error('Error checking user authorization:', error);
        return { authorized: false };
      }
    }
  }
};
</script>

