import AuthDialog from "@/components/AuthDialog";
export default function LoginPage(){
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Connexion</h2>
      <AuthDialog type="login" />
    </div>
  );
}
