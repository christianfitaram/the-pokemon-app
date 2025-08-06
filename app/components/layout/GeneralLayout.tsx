interface MainLayoutProps {
    children: React.ReactNode;
  }
  
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return(
        <div className="flex flex-col min-h-screen py-6">
{children}
        </div>
    )
}