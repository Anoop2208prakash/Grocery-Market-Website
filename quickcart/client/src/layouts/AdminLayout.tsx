import { Outlet, Link } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: '220px', background: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
        <h3>Admin Menu</h3>
        <nav>
          <ul>
            <li>
              <Link to="/admin">Dashboard</Link>
            </li>
            <li>
              <Link to="/admin/orders">Orders</Link>
            </li>
            <li>
              <Link to="/admin/inventory">Inventory</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '20px' }}>
        {/* Outlet renders the active child route (e.g., Dashboard page) */}
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;