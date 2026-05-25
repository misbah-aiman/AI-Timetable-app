import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export const OtpInput = ({ value, onChange, disabled }: Props) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const next = value.substring(0, i) + digit + value.substring(i + 1);
    onChange(next);
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) {
        onChange(value.substring(0, i) + value.substring(i + 1));
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        onChange(value.substring(0, i - 1) + value.substring(i));
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          disabled={disabled}
          className={[
            'w-11 h-14 text-center text-2xl font-bold rounded-2xl border-2 transition-all duration-150',
            'focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
            'dark:text-white dark:focus:ring-primary-900',
            value[i]
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30'
              : 'border-primary-100 dark:border-primary-900/30 bg-surface-50 dark:bg-[#221e15]',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
      ))}
    </div>
  );
};
