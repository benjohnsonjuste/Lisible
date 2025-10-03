import { PenTool, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';

export default function TextEditor() {
  return (
    <div>
      <PenTool />
      <AlignLeft />
      <AlignCenter />
      <AlignRight />
      <List />
      <ListOrdered />
    </div>
  );
}