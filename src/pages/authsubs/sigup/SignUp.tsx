import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailStep from "./EmailStep";
import PasswordStep from "./PasswordStep";
import "./signup.scss";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState<string>('');

  const handleEmailSubmit = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setCurrentStep('password');
  };

  const handlePasswordSubmit = async (email: string, password: string) => {
    // const artistId = localStorage.getItem("artistId");
    // if (!artistId) {
    //   console.error("Artist ID is missing");
    //   toast.error("error", "Artist ID is missing");
    //   return;
    // }
    // try {
    //   const userCredential = await createUserWithEmailAndPassword(
    //     auth,
    //     email,
    //     password
    //   );
    //   const user = userCredential.user;
    //   await createCustomer({
    //     accessToken: await user.getIdToken(),
    //     artistId: artistId,
    //   }).then((res) => {
    //     localStorage.setItem("userId", res.data?.customer?.id);
    //     localStorage.setItem("accessToken", res.data?.access_token);
    //     navigate("/dashboard");
    //   });
    // } catch (error) {
    //   console.error("Error creating user:", error);
    //   showAlert("error", error.message);
    // }
    
    console.log("Signup with:", email, password);
    // Navigate to next step or dashboard
    navigate("/dashboard");
  };

  const handleBack = () => {
    setCurrentStep('email');
  };

  if (currentStep === 'email') {
    return <EmailStep onEmailSubmit={handleEmailSubmit} />;
  }

  return (
    <PasswordStep 
      email={email} 
      onPasswordSubmit={handlePasswordSubmit} 
      onBack={handleBack} 
    />
  );
};

export default SignupPage;
