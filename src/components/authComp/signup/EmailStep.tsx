import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import "./signup.scss";
import { savedTeamInvite } from "../../../utils/teamInvite";

interface EmailStepProps {
  onEmailSubmit: (email: string) => void;
  isMobile?: boolean;
}

const EmailStep: React.FC<EmailStepProps> = ({ onEmailSubmit, isMobile }) => {
  const initialValues = {
    // an invited team member signs up with the invited email
    email: savedTeamInvite()?.email ?? "",
  };

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email format").required("Required"),
  });

  const handleSubmit = async (
    values: { email: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    onEmailSubmit(values.email);
    setSubmitting(false);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2>{isMobile ? "Lets get you started" : "Get Started"}</h2>
        <p className="subtext">
          {isMobile
            ? "Create an account to continue"
            : "Enter your email to create an account"}
        </p>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="signup-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                />
                <ErrorMessage name="email" component="div" className="error" />
              </div>

              <button
                type="submit"
                className="signup-button"
                disabled={isSubmitting}
              >
                Create Account
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EmailStep;
