import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  async getStats(period: string = 'today') {
    // Realistic restaurant data simulation
    return {
      dailySales: this.generateDailySales(),
      totalRevenue: {
        dineIn: 850000,
        takeaway: 420000,
        delivery: 155000,
        total: 1425000
      },
      stats: {
        totalOrders: {
          value: 142,
          change: 12.5,
          isPositive: true
        },
        newCustomers: {
          value: 28,
          change: -4.2,
          isPositive: false
        }
      },
      bestEmployees: [
        { id: '1', name: 'John Doe', role: 'Waiter', revenue: 125000, avatar: '👤' },
        { id: '2', name: 'Jane Smith', role: 'Cashier', revenue: 98000, avatar: '👤' },
        { id: '3', name: 'Michael Chen', role: 'Waiter', revenue: 84500, avatar: '👤' },
        { id: '4', name: 'Sarah Wilson', role: 'Waiter', revenue: 76000, avatar: '👤' },
        { id: '5', name: 'David Lee', role: 'Supervisor', revenue: 62000, avatar: '👤' }
      ],
      trendingDishes: [
        { id: '1', name: 'Jollof Rice & Chicken', category: 'Main', orders: 42 },
        { id: '2', name: 'Grilled Fish', category: 'Seafood', orders: 35 },
        { id: '3', name: 'Beef Suya', category: 'Grills', orders: 28 },
        { id: '4', name: 'Pounded Yam & Egusi', category: 'Local', orders: 24 },
        { id: '5', name: 'Fruit Salad', category: 'Dessert', orders: 18 }
      ]
    };
  }

  private generateDailySales() {
    const hours = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'];
    return hours.map(hour => ({
      hour,
      dineIn: Math.floor(Math.random() * 50000) + 20000,
      takeaway: Math.floor(Math.random() * 30000) + 10000,
      delivery: Math.floor(Math.random() * 20000) + 5000,
    }));
  }
}
