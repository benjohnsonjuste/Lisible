import  Checkbox  from '@/components/ui/Checkbox';
import  Bouton  from '@/components/ui/Bouton';

export default function PublierConfirmationModal({ onConfirm }) {
  return (
    <div>
      <Checkbox />
      <Button onClick={onConfirm}>Confirmer</Button>
    </div>
  );
}