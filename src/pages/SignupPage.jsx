import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link } from "react-router";
import useSignup from "../hooks/useSignup";
import AuthLayout, { AuthSubmitButton } from "../components/AuthLayout";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { isPending, error, signupMutation } = useSignup();

  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation(signupData);
  };

  const errorMessage = error?.response?.data?.message ||
    (error ? "We couldn't create your account. Please try again." : "");

  return (
    <AuthLayout
      title="Start with a hello."
      description="Create your account and make your next connection."
      switchLink={<>Already part of KYAU Chat? <Link to="/login">Sign in</Link></>}
    >
      <form className="auth-form" onSubmit={handleSignup}>
        {errorMessage && <div className="auth-error" role="alert">{errorMessage}</div>}
        <label className="auth-field">
          <span>Full name</span>
          <span className="auth-field__control">
            <UserRound className="auth-field__icon" size={17} aria-hidden="true" />
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="Your name"
              value={signupData.fullName}
              onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
              required
            />
          </span>
        </label>

        <label className="auth-field">
          <span>Email address</span>
          <span className="auth-field__control">
            <Mail className="auth-field__icon" size={17} aria-hidden="true" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              required
            />
          </span>
        </label>

        <label className="auth-field">
          <span>Password</span>
          <span className="auth-field__control">
            <LockKeyhole className="auth-field__icon" size={17} aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              minLength={6}
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              required
            />
            <button
              className="auth-field__toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
          <span className="auth-helper">Use at least 6 characters.</span>
        </label>

        <label className="auth-agreement">
          <input type="checkbox" required />
          <span>I agree to the <strong>terms of service</strong> and <strong>privacy policy</strong>.</span>
        </label>

        <AuthSubmitButton isPending={isPending}>
          {isPending ? "Creating account" : "Create account"}
        </AuthSubmitButton>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
