import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: OrderStatus | string;
};

type RootState = {
  auth: {
    token: string | null;
  };
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

function getStatusStyle(status: string) {
  switch (status) {
    case 'DELIVERED':
      return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'CANCELLED':
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    case 'SHIPPED':
      return { backgroundColor: '#dbeafe', color: '#1e40af' };
    default:
      return { backgroundColor: '#fef3c7', color: '#92400e' };
  }
}

export default function OrdersScreen() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const result = response.data;
      const orderList = Array.isArray(result) ? result : result?.orders;
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch {
      setError('تعذر تحميل الطلبات. تحقق من اتصالك وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={styles.helperText}>جاري تحميل الطلبات...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.message}>{error}</Text>
        <Text accessibilityRole="button" onPress={() => void fetchOrders()} style={styles.retry}>
          إعادة المحاولة
        </Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.message}>لا توجد طلبات حتى الآن</Text>
        <Text style={styles.helperText}>ستظهر طلباتك هنا بعد إتمامها.</Text>
      </View>
    );
  }

  return (
    <FlatList
      accessibilityLabel="قائمة الطلبات"
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const date = new Date(item.createdAt);
        const dateLabel = Number.isNaN(date.getTime())
          ? 'غير متاح'
          : date.toLocaleDateString('ar-SA');

        return (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.orderNumber}>طلب #{item.orderNumber}</Text>
              <Text style={[styles.status, statusStyle]}>
                {STATUS_LABELS[item.status] || item.status}
              </Text>
            </View>
            <Text style={styles.detail}>التاريخ: {dateLabel}</Text>
            <Text style={styles.detail}>
              الإجمالي:{' '}
              <Text style={styles.total}>{Number(item.total || 0).toFixed(2)} ريال</Text>
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  message: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retry: {
    color: '#7e22ce',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    padding: 8,
  },
  list: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderNumber: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  detail: {
    color: '#4b5563',
    fontSize: 14,
    marginTop: 5,
  },
  total: {
    color: '#9333ea',
    fontWeight: '700',
  },
});
