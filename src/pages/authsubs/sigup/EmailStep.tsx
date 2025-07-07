import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import "./signup.scss";

interface EmailStepProps {
  onEmailSubmit: (email: string) => void;
}

const EmailStep: React.FC<EmailStepProps> = ({ onEmailSubmit }) => {
  const initialValues = {
    email: "",
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
        <h2>Get Started</h2>
        <p className="subtext">
          Enter your login details to access your account
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
