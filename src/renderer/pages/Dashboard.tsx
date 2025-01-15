import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from '../components/ui/toast';
import { DollarSign, Package, BarChart2, ShoppingCart, Box, FileText } from 'lucide-react';

interface DashboardSummary {
  totalSales: number;
  todaySales: number;
  lowStockItems: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'inventory' | 'report';
  description: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // TODO: Replace with actual API calls
        const summaryData = await mockFetchSummary();
        const activityData = await mockFetchRecentActivity();
        setSummary(summaryData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error(t('dashboard.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  const mockFetchSummary = (): Promise<DashboardSummary> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalSales: 15000,
          todaySales: 1200,
          lowStockItems: 5,
        });
      }, 1000);
    });
  };

  const mockFetchRecentActivity = (): Promise<RecentActivity[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            type: 'sale',
            description: 'New sale: $150.00',
            timestamp: '2023-06-15T10:30:00Z',
          },
          {
            id: '2',
            type: 'inventory',
            description: 'Restocked: Widget A (50 units)',
            timestamp: '2023-06-15T09:45:00Z',
          },
          {
            id: '3',
            type: 'report',
            description: 'Monthly sales report generated',
            timestamp: '2023-06-14T17:00:00Z',
          },
          {
            id: '4',
            type: 'sale',
            description: 'New sale: $75.50',
            timestamp: '2023-06-14T14:20:00Z',
          },
          {
            id: '5',
            type: 'inventory',
            description: 'Low stock alert: Widget B',
            timestamp: '2023-06-14T11:10:00Z',
          },
        ]);
      }, 1000);
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const renderSummaryCard = (title: string, value: number | string, icon: React.ReactNode) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </>
        ) : summary ? (
          <>
            {renderSummaryCard(
              t('dashboard.totalSales'),
              formatCurrency(summary.totalSales),
              <DollarSign className="h-4 w-4 text-muted-foreground" />,
            )}
            {renderSummaryCard(
              t('dashboard.todaySales'),
              formatCurrency(summary.todaySales),
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
            )}
            {renderSummaryCard(
              t('dashboard.lowStockItems'),
              summary.lowStockItems,
              <Package className="h-4 w-4 text-muted-foreground" />,
            )}
          </>
        ) : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/sales">
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t('dashboard.newSale')}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/inventory">
                <Box className="mr-2 h-4 w-4" />
                {t('dashboard.manageInventory')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/reports">
                <FileText className="mr-2 h-4 w-4" />
                {t('dashboard.viewReports')}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : recentActivity.length > 0 ? (
              <ul className="space-y-2">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-center space-x-2">
                    {activity.type === 'sale' && <ShoppingCart className="h-4 w-4 text-primary" />}
                    {activity.type === 'inventory' && <Box className="h-4 w-4 text-secondary" />}
                    {activity.type === 'report' && <BarChart2 className="h-4 w-4 text-accent" />}
                    <span>{activity.description}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t('dashboard.noRecentActivity')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
