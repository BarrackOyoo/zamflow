import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize admin user
  const initializeAdmin = async () => {
    try {
      const adminRef = doc(db, 'users', 'admin@example.com');
      const adminSnap = await getDoc(adminRef);
      
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error initializing admin:', error);
    }
  };

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile with pending status
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: 'salesperson',
      status: 'pending',
      createdAt: new Date()
    });
    
    return user;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const getUserProfile = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  };

  const updateUserStatus = async (userId, status, role = null) => {
    const updateData = { status };
    if (role) updateData.role = role;
    await updateDoc(doc(db, 'users', userId), updateData);
  };

  useEffect(() => {
    initializeAdmin();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    getUserProfile,
    updateUserStatus,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};