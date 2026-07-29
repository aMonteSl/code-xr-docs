// Dumb component: renders an anchor styled as a button. All content and
// destinations come in through props; it holds no state and no copy.
// Every variant carries a 2px border (transparent when it isn't drawn) so all
// buttons are exactly the same height and align when placed side by side.
// Hover feedback is color-only — no scale, no colored shadows: the site's
// visual language is sober and free of glow effects.
const VARIANTS = {
  primary: 'border-2 border-transparent bg-accent text-on-accent hover:bg-accent-strong',
  secondary: 'border-2 border-accent text-accent hover:bg-accent hover:text-on-accent',
  ghost: 'border-2 border-transparent text-ink-muted hover:bg-surface-raised hover:text-ink',
};

const Button = ({ href, variant = 'primary', className = '', children, ...rest }) => {
  return (
    <a
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 py-3 text-center font-semibold transition-[background-color,border-color,color] duration-300 motion-reduce:transition-none ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
};

export default Button;
