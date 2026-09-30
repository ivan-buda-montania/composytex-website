import { useState } from 'react';
import { signIn, completeNewPassword, requestPasswordReset, confirmPasswordReset } from './auth';

// Steps: 'login' → ('newPassword' when Cognito requires it) | 'forgot' → 'reset'
export default function LoginPage({ onSignedIn }) {
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const submit = action => async e => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const login = submit(async () => {
    const result = await signIn(email.trim(), password);
    if (result.challenge) {
      setChallenge(result.challenge);
      setInfo('Por seguridad, define una contraseña nueva.');
      setStep('newPassword');
    } else {
      onSignedIn(result.session);
    }
  });

  const setFirstPassword = submit(async () => {
    onSignedIn(await completeNewPassword(challenge, newPassword));
  });

  const forgot = submit(async () => {
    await requestPasswordReset(email.trim());
    setInfo('Si el correo está registrado, recibirás un código de verificación.');
    setStep('reset');
  });

  const reset = submit(async () => {
    await confirmPasswordReset(email.trim(), code.trim(), newPassword);
    setInfo('Contraseña actualizada. Ya puedes iniciar sesión.');
    setPassword('');
    setNewPassword('');
    setStep('login');
  });

  const goTo = next => () => { setError(null); setInfo(null); setStep(next); };

  return (
    <div className="adm-center">
      <div className="adm-card adm-login">
        <img src="/assets/composytex-logo.svg" alt="Composytex" className="adm-login-logo" />
        <h1>Administración del catálogo</h1>

        {info && <div className="adm-alert adm-alert-ok">{info}</div>}
        {error && <div className="adm-alert adm-alert-error" role="alert">{error}</div>}

        {step === 'login' && (
          <form onSubmit={login}>
            <label className="adm-field">
              <span>Correo electrónico</span>
              <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Contraseña</span>
              <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            <button className="adm-btn adm-btn-primary adm-btn-block" disabled={busy}>
              {busy ? 'Entrando…' : 'Iniciar sesión'}
            </button>
            <button type="button" className="adm-link" onClick={goTo('forgot')}>¿Olvidaste tu contraseña?</button>
          </form>
        )}

        {step === 'newPassword' && (
          <form onSubmit={setFirstPassword}>
            <label className="adm-field">
              <span>Contraseña nueva</span>
              <input type="password" autoComplete="new-password" required minLength={12} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <small>Mínimo 12 caracteres, con mayúsculas, minúsculas y números.</small>
            </label>
            <button className="adm-btn adm-btn-primary adm-btn-block" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar y entrar'}
            </button>
          </form>
        )}

        {step === 'forgot' && (
          <form onSubmit={forgot}>
            <label className="adm-field">
              <span>Correo electrónico</span>
              <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <button className="adm-btn adm-btn-primary adm-btn-block" disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar código'}
            </button>
            <button type="button" className="adm-link" onClick={goTo('login')}>Volver</button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={reset}>
            <label className="adm-field">
              <span>Código de verificación</span>
              <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e => setCode(e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Contraseña nueva</span>
              <input type="password" autoComplete="new-password" required minLength={12} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <small>Mínimo 12 caracteres, con mayúsculas, minúsculas y números.</small>
            </label>
            <button className="adm-btn adm-btn-primary adm-btn-block" disabled={busy}>
              {busy ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
            <button type="button" className="adm-link" onClick={goTo('login')}>Volver</button>
          </form>
        )}
      </div>
    </div>
  );
}
