'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { fcfa } from '@/lib/api';

// Register all chart.js modules once
Chart.register(...registerables);

type Order = {
  id: number;
  reference: string;
  customer_name: string;
  region: string;
  total_amount: number;
  payment_method: 'wave' | 'orange_money' | 'cod';
  status: 'pending' | 'paid' | 'assigned' | 'delivered' | 'failed' | 'cancelled';
  refunded_amount?: number;
  created_at: string;
  items?: { product_name: string; quantity: number; unit_price: number }[];
};

export default function AdminCharts({ orders }: { orders: Order[] }) {
  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const donutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const lineChartInstance = useRef<Chart | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const statusChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const isRevenue = (o: Order) => ['paid','assigned','delivered'].includes(o.status) && (o.payment_method !== 'cod' || o.status === 'delivered');
    // 1. Prepare Data for Timeline (Past 7 days)
    const daysMap: Record<string, number> = {};
    const daysOrdersMap: Record<string, number> = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      daysMap[key] = 0;
      daysOrdersMap[key] = 0;
    }

    orders.forEach((o) => {
      if (!isRevenue(o)) return;
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      if (daysMap[key] !== undefined) {
        daysMap[key] += o.total_amount - (o.refunded_amount || 0);
        daysOrdersMap[key] += 1;
      } else {
        // If today or earlier
        const firstKey = Object.keys(daysMap)[Object.keys(daysMap).length - 1];
        daysMap[firstKey] = (daysMap[firstKey] || 0) + o.total_amount - (o.refunded_amount || 0);
        daysOrdersMap[firstKey] = (daysOrdersMap[firstKey] || 0) + 1;
      }
    });

    const timelineLabels = Object.keys(daysMap);
    const timelineRevenues = Object.values(daysMap);

    // 2. Prepare Data for Payments (Donut)
    const paymentTotals = {
      wave: 0,
      orange_money: 0,
      cod: 0,
    };
    orders.forEach((o) => {
      if (!isRevenue(o)) return;
      if (paymentTotals[o.payment_method] !== undefined) {
        paymentTotals[o.payment_method] += o.total_amount - (o.refunded_amount || 0);
      }
    });

    // 3. Prepare Data for Regions (Bar)
    const regionsMap: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status === 'cancelled' || o.status === 'failed') return;
      regionsMap[o.region] = (regionsMap[o.region] || 0) + 1;
    });

    // 4. Prepare Data for Statuses (Doughnut / Polar)
    const statusesMap = {
      pending: 0,
      paid: 0,
      assigned: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      if (statusesMap[o.status] !== undefined) {
        statusesMap[o.status] += 1;
      }
    });

    // ==========================================
    // CHART 1: LINE / AREA CHART (REVENUE TREND)
    // ==========================================
    if (lineCanvasRef.current) {
      if (lineChartInstance.current) lineChartInstance.current.destroy();

      const ctx = lineCanvasRef.current.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(194, 84, 45, 0.35)');
        gradient.addColorStop(1, 'rgba(194, 84, 45, 0.01)');

        lineChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: timelineLabels,
            datasets: [
              {
                label: "Chiffre d'Affaires (FCFA)",
                data: timelineRevenues,
                borderColor: '#C2542D',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#C2542D',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1A1615',
                titleFont: { size: 12, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: (ctx) => ` Recettes : ${fcfa(ctx.parsed.y ?? 0)}`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#635B56', font: { size: 11 } },
              },
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(233, 223, 213, 0.5)' },
                ticks: {
                  color: '#635B56',
                  font: { size: 11 },
                  callback: (val) => `${Number(val) / 1000}k`,
                },
              },
            },
          },
        });
      }
    }

    // ==========================================
    // CHART 2: DONUT CHART (PAYMENT MODES)
    // ==========================================
    if (donutCanvasRef.current) {
      if (donutChartInstance.current) donutChartInstance.current.destroy();

      const ctx = donutCanvasRef.current.getContext('2d');
      if (ctx) {
        donutChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Wave Sénégal', 'Orange Money', 'Paiement à la Livraison'],
            datasets: [
              {
                data: [paymentTotals.wave, paymentTotals.orange_money, paymentTotals.cod],
                backgroundColor: ['#1DA1F2', '#FF7900', '#0E7C4A'],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  padding: 14,
                  color: '#1A1615',
                  font: { size: 11, weight: 'bold' },
                },
              },
              tooltip: {
                backgroundColor: '#1A1615',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: (ctx) => ` ${ctx.label} : ${fcfa(Number(ctx.raw))}`,
                },
              },
            },
          },
        });
      }
    }

    // ==========================================
    // CHART 3: BAR CHART (REGIONS)
    // ==========================================
    if (barCanvasRef.current) {
      if (barChartInstance.current) barChartInstance.current.destroy();

      const ctx = barCanvasRef.current.getContext('2d');
      if (ctx) {
        barChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Object.keys(regionsMap),
            datasets: [
              {
                label: 'Commandes',
                data: Object.values(regionsMap),
                backgroundColor: '#8A3519',
                borderRadius: 8,
                hoverBackgroundColor: '#C2542D',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1A1615',
                padding: 10,
                cornerRadius: 8,
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#635B56', font: { size: 11, weight: 'bold' } },
              },
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(233, 223, 213, 0.5)' },
                ticks: { stepSize: 1, color: '#635B56', font: { size: 11 } },
              },
            },
          },
        });
      }
    }

    // ==========================================
    // CHART 4: DOUGHNUT CHART (ORDER STATUSES)
    // ==========================================
    if (statusCanvasRef.current) {
      if (statusChartInstance.current) statusChartInstance.current.destroy();

      const ctx = statusCanvasRef.current.getContext('2d');
      if (ctx) {
        statusChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['En attente', 'Payée', 'Assignée livreur', 'Livrée', 'Échouée', 'Annulée'],
            datasets: [
              {
                data: [
                  statusesMap.pending,
                  statusesMap.paid,
                  statusesMap.assigned,
                  statusesMap.delivered,
                  statusesMap.failed,
                  statusesMap.cancelled,
                ],
                backgroundColor: ['#F59E0B', '#38BDF8', '#A855F7', '#10B981', '#EF4444', '#9CA3AF'],
                borderColor: '#ffffff',
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 10,
                  padding: 10,
                  color: '#1A1615',
                  font: { size: 10, weight: 'bold' },
                },
              },
              tooltip: {
                backgroundColor: '#1A1615',
                padding: 10,
                cornerRadius: 8,
              },
            },
          },
        });
      }
    }

    return () => {
      lineChartInstance.current?.destroy();
      donutChartInstance.current?.destroy();
      barChartInstance.current?.destroy();
      statusChartInstance.current?.destroy();
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      
      {/* Top Row: Revenue Area Chart & Payment Donut Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Revenue Evolution Curve */}
        <div className="lg:col-span-7 rounded-3xl border border-sand-200 bg-white p-6 shadow-luxury-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sand-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">Diagramme Temporel</span>
              <h3 className="font-serif text-base font-bold text-onyx">Courbe des Ventes & Recettes (FCFA)</h3>
            </div>
            <span className="rounded-full bg-terracotta-50 px-2.5 py-0.5 text-xs font-extrabold text-terracotta-700 border border-terracotta-200/60">
              7 Derniers Jours
            </span>
          </div>

          <div className="relative h-64 w-full">
            <canvas ref={lineCanvasRef} />
          </div>

          <div className="flex items-center justify-between text-xs text-onyx-light pt-2 border-t border-sand-100">
            <span>Données synchronisées en temps réel</span>
            <span className="font-semibold text-onyx">Axe Y : Milliers de FCFA</span>
          </div>
        </div>

        {/* Chart 2: Payment Donut Diagram */}
        <div className="lg:col-span-5 rounded-3xl border border-sand-200 bg-white p-6 shadow-luxury-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-sand-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">Diagramme Circulaire</span>
            <h3 className="font-serif text-base font-bold text-onyx">Répartition par Mode de Paiement</h3>
          </div>

          <div className="relative h-56 w-full flex items-center justify-center">
            <canvas ref={donutCanvasRef} />
          </div>

          <p className="text-center text-[11px] text-onyx-muted border-t border-sand-100 pt-2">
            Volume comparé : Wave • Orange Money • Espèces
          </p>
        </div>

      </div>

      {/* Bottom Row: Regional Delivery Bar Chart & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 3: Regions Bar Chart */}
        <div className="lg:col-span-7 rounded-3xl border border-sand-200 bg-white p-6 shadow-luxury-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sand-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">Histogramme Régional</span>
              <h3 className="font-serif text-base font-bold text-onyx">Commandes par Région du Sénégal</h3>
            </div>
            <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-bold text-onyx">
              🇸🇳 National
            </span>
          </div>

          <div className="relative h-56 w-full">
            <canvas ref={barCanvasRef} />
          </div>

          <div className="flex items-center justify-between text-xs text-onyx-light pt-2 border-t border-sand-100">
            <span>Dakar, Thiès, Diourbel, Saint-Louis...</span>
            <span className="font-semibold text-onyx">Unité : Colis expédiés</span>
          </div>
        </div>

        {/* Chart 4: Order Status Funnel / Doughnut */}
        <div className="lg:col-span-5 rounded-3xl border border-sand-200 bg-white p-6 shadow-luxury-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-sand-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">Diagramme Logistique</span>
            <h3 className="font-serif text-base font-bold text-onyx">Statuts des Commandes</h3>
          </div>

          <div className="relative h-56 w-full flex items-center justify-center">
            <canvas ref={statusCanvasRef} />
          </div>

          <p className="text-center text-[11px] text-onyx-muted border-t border-sand-100 pt-2">
            En attente • Payée • Livreur assigné • Livrée
          </p>
        </div>

      </div>

    </div>
  );
}
