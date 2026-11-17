import { useEffect } from 'react';

const INPUT_SELECTOR =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])' +
  ':not([type="button"]):not([type="submit"]):not([type="reset"])' +
  ':not([type="file"]):not([type="range"]):not([type="color"])' +
  ':not([disabled]):not([readonly])';

function isNavigableInput(element: Element): element is HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) return false;
  if (element.disabled || element.readOnly) return false;
  return ![
    'hidden',
    'checkbox',
    'radio',
    'button',
    'submit',
    'reset',
    'file',
    'range',
    'color',
  ].includes(element.type.toLowerCase());
}

/**
 * Global fast-entry navigation.
 *
 * Pressing Enter inside a text/number input prevents the browser's implicit
 * form submission and focuses the next input in DOM order. The last input is
 * blurred so the user gets a clear "done" state.
 */
export function useEnterKeyNavigation(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      if (event.defaultPrevented || event.isComposing) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!isNavigableInput(target)) return;

      const root = target.form ?? document;
      const inputs = Array.from(
        root.querySelectorAll<HTMLInputElement>(INPUT_SELECTOR),
      ).filter(isNavigableInput);

      const index = inputs.indexOf(target);
      if (index === -1) return;

      event.preventDefault();
      const next = inputs[index + 1];
      if (next) {
        next.focus();
      } else {
        target.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled]);
}
