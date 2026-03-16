import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Button } from 'react-bootstrap';

const Inventory = () => {
    const [orders, setOrders] = useState([]);
    const [newOrder, setNewOrder] = useState({});
    const [selectedTab, setSelectedTab] = useState('Supplies');

    useEffect(() => {
        // Load initial orders from localStorage
        const savedOrders = JSON.parse(localStorage.getItem('cattalytics:inventoryOrders')) || [];
        setOrders(savedOrders);
    }, []);

    const createOrder = () => {
        // Logic to create order
        const orderId = Date.now();
        const order = { id: orderId, ...newOrder, status: 'Pending' };
        const updatedOrders = [...orders, order];
        setOrders(updatedOrders);
        localStorage.setItem('cattalytics:inventoryOrders', JSON.stringify(updatedOrders));
        setNewOrder({}); // Reset new order
    };

    const markOrderAsReceived = (orderId) => {
        const updatedOrders = orders.map(order => {
            if (order.id === orderId) {
                order.status = 'Received';
                // Check line items, update inventory, add history, set lastOrdered 
                // (Your logic to handle inventory should go here)
            }
            return order;
        });
        setOrders(updatedOrders);
        localStorage.setItem('cattalytics:inventoryOrders', JSON.stringify(updatedOrders));
    };

    return (
        <div>
            <h1>Inventory</h1>
            <Tabs activeKey={selectedTab} onSelect={(k) => setSelectedTab(k)}>
                <Tab eventKey="Supplies" title="Supplies">
                    {/* Existing Supplies components */}
                </Tab>
                <Tab eventKey="Equipment" title="Equipment">
                    {/* Existing Equipment components */}
                </Tab>
                <Tab eventKey="Orders" title="Orders">
                    <Button onClick={createOrder}>Create Order</Button>
                    {/* Order listing and UI should go here */}
                    {orders.map(order => (
                        <div key={order.id}>
                            <span>{`Order ID: ${order.id} - Status: ${order.status}`}</span>
                            {order.status === 'Pending' && <Button onClick={() => markOrderAsReceived(order.id)}>Mark as Received</Button>}
                        </div>
                    ))}
                </Tab>
            </Tabs>
        </div>
    );
};

export default Inventory;