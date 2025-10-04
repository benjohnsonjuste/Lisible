import { useState } from 'react';
import Checkbox from '@/components/ui/Checkbox'; // Vérifie que ce fichier existe
import Button from '@/components/ui/Button'; // ✅ Renommé pour correspondre à l'utilisation dans le JSX

export default function LoginForm() {
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <form>
      {/* Ton formulaire */}
      <Checkbox 
        checked={rememberMe} 
        onCheckedChange={(checked) => setRememberMe(checked)} 
      />
      <Button type="submit">Se connecter</Button>
    </form>
  );
}