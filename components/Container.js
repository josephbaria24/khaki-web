export default function Container({ className = "", children, as: Tag = "div" }) {
  return (
    <Tag className={`mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10 ${className}`}>
      {children}
    </Tag>
  );
}
