import { CODE_XR_LOGO } from '@/lib/logoPaths';

// Dumb component: the Code-XR mark as inline SVG, so it inherits the current
// text color and needs no second file per theme (unlike the icon_white.svg /
// icon_black.svg pair) and costs no network request.
//
// Decorative by default. Pass `title` when the mark is the only thing carrying
// meaning — that promotes it to role="img" with an accessible name.
const CodeXrLogo = ({ title, className = '', ...rest }) => {
  return (
    <svg
      viewBox={CODE_XR_LOGO.viewBox}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path fillRule="nonzero" d={CODE_XR_LOGO.shell} />
      <path fillRule="nonzero" d={CODE_XR_LOGO.letterX} />
      <path fillRule="nonzero" d={CODE_XR_LOGO.letterR} />
    </svg>
  );
};

export default CodeXrLogo;
