// Dumb component: renders an anchor styled as a button. All content and
// destinations come in through props; it holds no state and no copy.
const VARIANTS = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-strong shadow-lg shadow-accent/25',
  secondary:
    'border-2 border-accent text-accent hover:bg-accent hover:text-on-accent',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-raised',
};

const Button = ({ href, variant = 'primary', className = '', children, ...rest }) => {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
};

export default Button;
