import  Checkbox  from '@/components/ui/Checkbox';
import  Button  from '@/components/ui/Button';

export default function PublierConfirmationModal({ onConfirm }) {
  return (
    <div>
      <Checkbox />
      <Button onClick={onConfirm}>Confirmer</Button>
    </div>
  );
}