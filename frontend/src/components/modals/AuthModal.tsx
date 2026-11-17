import { useEffect, useState, type FormEvent } from 'react';
import { CircleAlert, CircleCheck, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../hooks/useI18n';
import { Button } from '../common/Button';
import { Field, TextInput } from '../common/Field';
import { Modal } from '../common/Modal';

type AuthMode = 'signin' | 'signup';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export function AuthModal({
  open,
  onClose,
  initialMode = 'signin',
}: AuthModalProps) {
  const { isConfigured, signIn, signUp } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /* Reset transient messages whenever the dialog or mode changes. */
  useEffect(() => {
    setError(null);
    setNotice(null);
    setConfirmPassword('');
  }, [open, mode]);

  useEffect(() => {
    if (!open) {
      setPassword('');
      setConfirmPassword('');
      setSubmitting(false);
    }
  }, [open]);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t('auth.errorEmailRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errorPasswordLength'));
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }

    setSubmitting(true);
    const result = isSignUp
      ? await signUp(trimmedEmail, password)
      : await signIn(trimmedEmail, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error || t('auth.genericError'));
      return;
    }

    if (isSignUp && result.needsEmailConfirmation) {
      setNotice(t('auth.confirmEmailNotice'));
      setPassword('');
      setConfirmPassword('');
      return;
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSignUp ? t('auth.signUpTitle') : t('auth.signInTitle')}
      description={
        isSignUp ? t('auth.signUpDescription') : t('auth.signInDescription')
      }
      size="sm"
      closeLabel={t('common.close')}
    >
      {!isConfigured ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-surface p-3 text-small text-warning">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{t('auth.notConfigured')}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field id="auth-email" label={t('auth.email')}>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-primary/40"
            />
            <TextInput
              id="auth-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              dir="ltr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="ps-9"
              required
            />
          </div>
        </Field>

        <Field id="auth-password" label={t('auth.password')}>
          <TextInput
            id="auth-password"
            type="password"
            name="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            dir="ltr"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </Field>

        {isSignUp ? (
          <Field id="auth-confirm-password" label={t('auth.confirmPassword')}>
            <TextInput
              id="auth-confirm-password"
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              dir="ltr"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={6}
              required
            />
          </Field>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-surface p-3 text-small text-danger"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {notice ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-success/30 bg-success-surface p-3 text-small text-success"
          >
            <CircleCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <p>{notice}</p>
          </div>
        ) : null}

        <Button
          type="submit"
          variant="accent"
          size="md"
          fullWidth
          loading={submitting}
          disabled={!isConfigured}
        >
          {submitting
            ? isSignUp
              ? t('auth.signingUp')
              : t('auth.signingIn')
            : isSignUp
              ? t('auth.signUpAction')
              : t('auth.signInAction')}
        </Button>
      </form>

      <p className="mt-4 flex flex-wrap items-center justify-center gap-1 text-small text-primary/60">
        <span>{isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}</span>
        <button
          type="button"
          onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
          className="rounded-sm font-medium text-accent transition hover:underline focus-visible:outline-none focus-visible:shadow-focus"
        >
          {isSignUp ? t('auth.switchToSignIn') : t('auth.switchToSignUp')}
        </button>
      </p>
    </Modal>
  );
}
