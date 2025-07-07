import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import "./signup.scss";

interface PasswordStepProps {
  email: string;
  onPasswordSubmit: (email: string, password: string) => void;
  onBack: () => void;
}

const PasswordStep: React.FC<PasswordStepProps> = ({
  email,
  onPasswordSubmit,
  onBack,
}) => {
  const initialValues = {
    password: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Required"),
  });

  const handleSubmit = async (
    values: { password: string; confirmPassword: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    onPasswordSubmit(email, values.password);
    setSubmitting(false);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div
          className="back-button"
          onClick={onBack}
          style={{ textAlign: "left", marginBottom: "20px", cursor: "pointer" }}
        >
          ← Back
        </div>
        <h2>Create your Password</h2>
        <p className="subtext">Create your password</p>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="signup-form">
              <div className="form-group">
                <label htmlFor="password">Create Password</label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter Password"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="error"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Field
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter Password"
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="error"
                />
              </div>

              <button
                type="submit"
                className="signup-button"
                disabled={isSubmitting}
              >
                Continue
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default PasswordStep;
