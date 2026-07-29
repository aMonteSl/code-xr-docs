// Dumb layout component: centered content column with page gutters.
//
// 84rem rather than the old 72rem: the navbar needs 1285px to keep its nine
// section links on one line (147 brand + 845 links + 197 actions + gaps and
// gutters, measured), and the page content shares this width so the bar lines
// up with everything under it. The extra 59px over the strict minimum is
// deliberate slack for font rendering that differs from the machine it was
// measured on.
//
// Reading width is unaffected: prose blocks cap themselves at max-w-3xl.
const Container = ({ as: Tag = 'div', className = '', children }) => {
  return (
    <Tag className={`mx-auto w-full max-w-[84rem] px-6 sm:px-8 ${className}`}>
      {children}
    </Tag>
  );
};

export default Container;
