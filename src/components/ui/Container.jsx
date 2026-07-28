// Dumb layout component: centered content column with page gutters.
const Container = ({ as: Tag = 'div', className = '', children }) => {
  return (
    <Tag className={`mx-auto w-full max-w-6xl px-6 sm:px-8 ${className}`}>
      {children}
    </Tag>
  );
};

export default Container;
