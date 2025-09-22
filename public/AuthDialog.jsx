import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/router';

export default function AuthDialog({ type = 'login' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const handleEmail = async () => {
    try {
      if (type === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow w-96 mx-auto my-10">
      <h1 className="text-xl font-bold mb-4">{type === 'login' ? 'Connexion' : 'Inscription'}</h1>
      <button onClick={handleGoogle} className="w-full bg-red-500 text-white py-2 rounded mb-4">Continuer avec Google</button>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded mb-2" />
      <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded mb-2" />
      <button onClick={handleEmail} className="w-full bg-blue-600 text-white py-2 rounded">{type === 'login' ? 'Se connecter' : 'S’inscrire'}</button>
    </div>
  );
}
