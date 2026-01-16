import { useState } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { OrdersPage } from '@/components/OrdersPage';
import { ProductsPage } from '@/components/ProductsPage';
import { MaterialsPage } from '@/components/MaterialsPage';
import { UsersPage } from '@/components/UsersPage';
import { getCurrentUser } from '@/lib/storage';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getCurrentUser());
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrdersPage />;
      case 'products':
        return <ProductsPage />;
      case 'materials':
        return <MaterialsPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={() => setIsLoggedIn(false)}
    >
      {renderPage()}
    </Layout>
  );
};

export default Index;
