import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Iniciar Sesión | Embid Distribuidora S.A.C"
        description="Inicia sesión en tu cuenta"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
