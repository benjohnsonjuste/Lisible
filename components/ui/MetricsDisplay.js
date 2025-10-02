// components/ui/MetricsDisplay.jsx
import React, { useState, useEffect } from "react";
import { cn } from "../../utils/cn";
import { Eye, Users, FileText, TrendingUp } from "../AppIcon";

const formatNumber = (num) =>
  new Intl.NumberFormat("fr-FR").format(num || 0);

const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount || 0);

const MetricsDisplay = ({ className, initialMetrics, previousMetrics }) => {
  const [metrics, setMetrics] = useState(initialMetrics || {});

  // Calcul du pourcentage de changement
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Simulation de mise à jour en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        subscribers: prev?.subscribers + Math.floor(Math.random() * 3),
        totalViews: prev?.totalViews + Math.floor(Math.random() * 10),
        monthlyEarnings: prev?.monthlyEarnings + Math.floor(Math.random() * 5),
        publishedTexts: prev?.publishedTexts,
      }));
    }, 30000); // toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const metricCards = [
    {
      title: "Abonnés",
      value: metrics?.subscribers,
      previous: previousMetrics?.subscribers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Vues totales",
      value: metrics?.totalViews,
      previous: previousMetrics?.totalViews,
      icon: Eye,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Gains mensuels",
      value: metrics?.monthlyEarnings,
      previous: previousMetrics?.monthlyEarnings,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      format: formatCurrency,
    },
    {
      title: "Textes publiés",
      value: metrics?.publishedTexts,
      previous: previousMetrics?.publishedTexts,
      icon: FileText,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        const change = calculateChange(metric.value, metric.previous);
        const displayValue = metric.format ? metric.format(metric.value) : formatNumber(metric.value);

        return (
          <div
            key={index}
            className={cn(
              "flex flex-col justify-center items-center p-4 rounded-lg border",
              metric.bgColor
            )}
          >
            <div className="flex items-center justify-center mb-2">
              <Icon size={24} className={cn(metric.color, "mr-2")} />
              <h3 className="text-sm font-medium text-foreground">{metric.title}</h3>
            </div>
            <p className="text-2xl font-semibold text-foreground">{displayValue}</p>
            {change !== 0 && (
              <span
                className={cn(
                  "text-xs font-medium mt-1",
                  change > 0 ? "text-success" : "text-destructive"
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MetricsDisplay;