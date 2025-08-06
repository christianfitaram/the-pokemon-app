interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return <div className="flex flex-col min-h-[80vh] py-6">{children}</div>;
};
