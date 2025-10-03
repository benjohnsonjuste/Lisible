import AuthentificationLayout from "@/components/ui/AuthentificationLayout";
import LoginForm from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <AuthenticationLayout
      title="Se connecter à Lisible"
      subtitle="Accédez à votre compte et continuez à lire vos histoires préférées"
    >
      <LoginForm />
    </AuthenticationLayout>
  );
}