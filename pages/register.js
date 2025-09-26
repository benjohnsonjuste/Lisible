import AuthDialog from "@/components/AuthDialog";
export default function RegisterPage(){
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Inscription</h2>
      <AuthDialog type="register" />
    </div>
  );
}
