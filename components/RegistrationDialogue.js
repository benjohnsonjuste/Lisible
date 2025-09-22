import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/router';

export default function RegistrationDialogue() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const handleRegister = async () => {
    if (!terms) return alert('Acceptez les termes et conditions');
    await createUserWithEmailAndPassword(auth, email, password);
    router.push('/dashboard');
  };

  const handleGoogle = async () => {
    await signInWithPopup(auth, provider);
    router.push('/dashboard');
  };

  return (
    <div className="bg-white p-8 rounded shadow-lg w-96 mx-auto my-10">
      <h1 className="text-2xl font-bold mb-4">Inscription</h1>
      <button onClick={handleGoogle} className="w-full bg-red-500 text-white py-2 rounded mb-4">
        Continuer avec Google
      </button>
      <input type="email" placeholder="Email" className="w-full border p-2 rounded mb-2" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Mot de passe" className="w-full border p-2 rounded mb-2" onChange={e => setPassword(e.target.value)} />
      <label className="flex items-center mb-2">
        <input type="checkbox" className="mr-2" checked={terms} onChange={() => setTerms(!terms)} /> J'accepte les termes et conditions
      </label>
      <button onClick={handleRegister} className="w-full bg-blue-600 text-white py-2 rounded">S'inscrire</button>
    </div>
  );
}
