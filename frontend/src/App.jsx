/**
 * Main App Component
 * 
 * Sets up routing and the main layout structure.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Analysis from './pages/Analysis/Analysis';
import Trades from './pages/Trades/Trades';
import TradeDetails from './pages/TradeDetails/TradeDetails';
import Settings from './pages/Settings/Settings';

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Navigate to="/analysis" replace />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/trades" element={<Trades />} />
                <Route path="/trades/:tradeId" element={<TradeDetails />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Layout>
    );
}

export default App;
