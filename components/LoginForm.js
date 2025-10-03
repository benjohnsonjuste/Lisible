import  useState  from 'react';
import  Checkbox  from '@/components/ui/Checkbox'; // Vérifie que le fichier existe
import  Bouton  from '@/components/ui/Bouton'; // Import Button si utilisé

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