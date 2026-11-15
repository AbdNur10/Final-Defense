import { ArrowUpRight, MessageSquareText } from "lucide-react";
import "./AuthLayout.css";

const AuthLayout = ({ title, description, children, switchLink }) => (
  <main className="auth-page">
    <aside className="auth-story" aria-label="KYAU Chat introduction">
      <div className="auth-brand">
        <span className="auth-brand__icon" aria-hidden="true"><MessageSquareText size={22} strokeWidth={2.2} /></span>
        <span className="auth-brand__name">KYAU CHAT</span>
      </div>
      <div className="auth-story__content">
        <p className="auth-kicker"><span /> A GOOD PLACE TO BEGIN</p>
        <h1>Make room for<br />a new <em>hello.</em></h1>
        <p className="auth-story__description">A little curiosity can take you a long way. Start with a conversation.</p>
        <div className="auth-art">
          <img className="auth-art__image" src="/i.png" alt="Two friends sharing a video conversation" />
          <div className="auth-art__caption"><span className="auth-art__index">01</span><span>Every connection starts somewhere.</span></div>
        </div>
      </div>
      <div className="auth-story__footer"><span>KYAU CHAT</span><span>CONVERSATIONS THAT CONNECT</span></div>
    </aside>
    <section className="auth-main">
      <div className="auth-main__inner">
        <div className="auth-heading">
          <p className="auth-eyebrow">YOUR NEXT CHAPTER</p>
          <h2>{title}</h2>
          <p className="auth-heading__description">{description}</p>
        </div>
        {children}
        <div className="auth-switch">{switchLink}</div>
        <p className="auth-privacy">A thoughtful space for real conversations.</p>
      </div>
    </section>
  </main>
);

export const AuthSubmitButton = ({ children, isPending }) => (
  <button className="auth-submit" type="submit" disabled={isPending}>
    <span>{children}</span>
    {isPending ? <span className="auth-spinner" aria-label="Loading" /> : <ArrowUpRight size={18} />}
  </button>
);

export default AuthLayout;