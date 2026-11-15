import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link } from "react-router";
import AuthLayout, { AuthSubmitButton } from "../components/AuthLayout";
import useLogin from "../hooks/useLogin";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const { loginMutation, isPending, error } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  const errorMessage = error?.response?.data?.message ||
    (error ? "We couldn't sign you in. Please check your details and try again." : "");

  return (
    <AuthLayout
      title="Welcome back."
      description="Pick up where your conversations left off."
      switchLink={<>New to KYAU Chat? <Link to="/signup">Create an account</Link></>}
    >
      <form className="auth-form" onSubmit={handleLogin}>
        {errorMessage && <div className="auth-error" role="alert">{errorMessage}</div>}
        <label className="auth-field">
          <span>Email address</span>
          <span className="auth-field__control">
            <Mail className="auth-field__icon" size={17} aria-hidden="true" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
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
              autoComplete="current-password"
              placeholder="Enter your password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
        </label>

        <AuthSubmitButton isPending={isPending}>
          {isPending ? "Signing in" : "Sign in"}
        </AuthSubmitButton>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
