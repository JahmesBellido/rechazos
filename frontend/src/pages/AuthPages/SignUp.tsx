import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Regístrate | Embid Distribuidora S.A.C"
        description="Crea una nueva cuenta"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
